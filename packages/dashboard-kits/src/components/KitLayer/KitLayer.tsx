import { useTheme } from "@openuidev/react-ui";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useIsomorphicLayoutEffect } from "../../hooks/useIsomorphicLayoutEffect";

/** Space kept between a popup and the edge of the window. */
const EDGE = 8;

/**
 * Renders kit popups (tooltips, definitions) on document.body, above the
 * page. Inside a dashboard they sat in cards that clip their overflow, so a
 * popup near a card's edge was cut off. The layer carries the kit theme
 * (`.kit-theme`, its light or dark mode, and react-ui's portal theme class),
 * so popups look the same as before.
 *
 * `anchor` is any element inside the dashboard; the layer reads the kit
 * theme's mode from it. Renders nothing on the server.
 */
export function KitLayer({
  anchor,
  children,
}: {
  anchor: RefObject<Element | null>;
  children: ReactNode;
}) {
  const { mode, portalThemeClassName } = useTheme();
  const [host, setHost] = useState<{ mode: string } | null>(null);
  useEffect(() => {
    const themed = anchor.current?.closest(".kit-theme");
    setHost({ mode: themed?.getAttribute("data-mode") ?? mode });
  }, [anchor, mode]);
  if (!host) return null;
  return createPortal(
    <div className={`kit-theme kit-layer ${portalThemeClassName}`} data-mode={host.mode}>
      {children}
    </div>,
    document.body,
  );
}

/**
 * Where a popup of size `w`×`h` goes beside `rect` (viewport coordinates):
 * below it, or above when there's no room below, kept inside the window.
 */
export function placeBeside(rect: DOMRect, w: number, h: number, gap = 6) {
  const below = rect.bottom + gap;
  const above = rect.top - gap - h;
  const top =
    below + h <= window.innerHeight - EDGE || above < EDGE
      ? Math.min(below, Math.max(EDGE, window.innerHeight - EDGE - h))
      : above;
  const left = Math.min(Math.max(EDGE, rect.left), Math.max(EDGE, window.innerWidth - EDGE - w));
  return { top, left };
}

/** Keeps a point-anchored popup of size `w`×`h` inside the window. */
export function clampToWindow(x: number, y: number, w: number, h: number) {
  return {
    x: Math.min(Math.max(EDGE, x), Math.max(EDGE, window.innerWidth - EDGE - w)),
    y: Math.min(Math.max(EDGE, y), Math.max(EDGE, window.innerHeight - EDGE - h)),
  };
}

/**
 * Hover-and-focus state for an element with a popup, with the short delay
 * the definitions always had (so a click on a tile doesn't flash one).
 * Attaches to the nearest `.kit-def-host` around `anchor`.
 */
export function useHoverOpen(anchor: RefObject<Element | null>, delay = 350) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const host = anchor.current?.closest(".kit-def-host") as HTMLElement | null;
    if (!host) return;
    const show = () => {
      clearTimeout(timer.current);
      setRect(host.getBoundingClientRect());
      timer.current = setTimeout(() => setOpen(true), delay);
    };
    const hide = (event: Event) => {
      // Leaving the pointer while focus stays inside keeps it open, and vice versa.
      if (event.type === "mouseleave" && host.contains(document.activeElement)) return;
      if (event.type === "focusout" && host.matches(":hover")) return;
      clearTimeout(timer.current);
      setOpen(false);
    };
    host.addEventListener("mouseenter", show);
    host.addEventListener("focusin", show);
    host.addEventListener("mouseleave", hide);
    host.addEventListener("focusout", hide);
    return () => {
      clearTimeout(timer.current);
      host.removeEventListener("mouseenter", show);
      host.removeEventListener("focusin", show);
      host.removeEventListener("mouseleave", hide);
      host.removeEventListener("focusout", hide);
    };
  }, [anchor, delay]);

  // Follow the element while open: the page can scroll or resize under it.
  useEffect(() => {
    if (!open) return;
    const host = anchor.current?.closest(".kit-def-host");
    const update = () => host && setRect(host.getBoundingClientRect());
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchor]);

  return { open, rect };
}

/** Places a popup element beside `rect` once its size is known. */
export function useBesidePlacement(
  popup: RefObject<HTMLElement | null>,
  rect: DOMRect | null,
  open: boolean,
) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useIsomorphicLayoutEffect(() => {
    const el = popup.current;
    if (!el || !rect) return;
    setPos(placeBeside(rect, el.offsetWidth, el.offsetHeight));
  }, [popup, rect, open]);
  return pos;
}

/**
 * A popup shown while the nearest `.kit-def-host` around it is hovered or
 * holds focus, drawn on the kit layer beside that host. `id` is what the host
 * element's aria-describedby points at.
 */
export function HoverTip({ id, children }: { id: string; children: ReactNode }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const { open, rect } = useHoverOpen(anchor);
  const pos = useBesidePlacement(tip, rect, open);
  return (
    <>
      <span ref={anchor} hidden />
      <KitLayer anchor={anchor}>
        <span
          ref={tip}
          id={id}
          role="tooltip"
          className="kit-def"
          data-open={open && pos ? "" : undefined}
          style={pos ?? undefined}
        >
          {children}
        </span>
      </KitLayer>
    </>
  );
}

/** The nearest ancestor a popup's coordinates were measured from. */
export function positionedParent(el: Element | null): Element | null {
  let p = el?.parentElement ?? null;
  while (p && getComputedStyle(p).position === "static") p = p.parentElement;
  return p;
}
