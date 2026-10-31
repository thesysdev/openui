"use client";

import clsx from "clsx";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { names, styles } from "./popover.styles";

/** Space kept between the panel and the screen edge, and between the panel and its trigger. */
const EDGE = 12;
const GAP = 8;

export interface PopoverProps {
  /** What opens the panel: text, or an icon such as an info glyph. */
  trigger: ReactNode;
  /** The panel's content. */
  children: ReactNode;
}

/**
 * Opens a small, non-modal panel. Positioned from the panel's measured size
 * (before paint, so it never jumps): below the trigger, or above when there
 * is no room below and there is room above, and kept inside the screen.
 * Focus moves into the panel on open. Escape, or tabbing past the panel's
 * first or last control, closes it and returns focus to the trigger, so the
 * page's tab order continues from there; clicking elsewhere closes it too.
 * An icon-only trigger is named "Show details", which also names the panel.
 */
export function Popover({ trigger, children }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const triggerId = `${id}-trigger`;
  const panelId = `${id}-panel`;

  // An icon-only trigger has no text to name it (or the panel it labels).
  const [unnamed, setUnnamed] = useState(false);
  useLayoutEffect(() => setUnnamed(!button.current?.textContent?.trim()));

  const close = (refocus: boolean) => {
    setOpen(false);
    setAt(null);
    if (refocus) button.current?.focus();
  };

  useLayoutEffect(() => {
    if (!open || !button.current || !panel.current) return;
    const r = button.current.getBoundingClientRect();
    const { width, height } = panel.current.getBoundingClientRect();
    const fitsBelow = r.bottom + GAP + height <= window.innerHeight - EDGE;
    const fitsAbove = r.top - GAP - height >= EDGE;
    const top = !fitsBelow && fitsAbove ? r.top - GAP - height : r.bottom + GAP;
    const left = Math.min(Math.max(EDGE, r.left), window.innerWidth - width - EDGE);
    setAt({ left: Math.max(EDGE, left), top });
  }, [open]);

  useEffect(() => {
    if (at) panel.current?.focus({ preventScroll: true });
  }, [at]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !button.current?.contains(target)) close(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    const onScroll = () => close(!!panel.current?.contains(document.activeElement));
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={button}
        id={triggerId}
        type="button"
        className={clsx(styles.trigger, names.trigger)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={unnamed ? "Show details" : undefined}
        onClick={() => (open ? close(false) : setOpen(true))}
      >
        {trigger}
      </button>
      {open &&
        createPortal(
          <div
            ref={panel}
            id={panelId}
            role="dialog"
            aria-labelledby={triggerId}
            tabIndex={-1}
            className={clsx(styles.panel, names.panel)}
            // Measured first (hidden), then placed: see the layout effect above.
            style={at ? { left: at.left, top: at.top } : { left: 0, top: 0, visibility: "hidden" }}
            data-theme={button.current?.closest("[data-theme]")?.getAttribute("data-theme") ?? undefined}
            onKeyDown={(event) => {
              if (event.key !== "Tab" || !panel.current) return;
              const focusable = [...panel.current.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])")];
              const first = focusable[0] ?? panel.current;
              const last = focusable[focusable.length - 1] ?? panel.current;
              const leaving = event.shiftKey
                ? document.activeElement === first || document.activeElement === panel.current
                : document.activeElement === last || (focusable.length === 0 && document.activeElement === panel.current);
              if (!leaving) return;
              event.preventDefault();
              close(true);
            }}
            onBlur={(event) => {
              const next = event.relatedTarget as Node | null;
              if (next && !panel.current?.contains(next) && next !== button.current) close(false);
            }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
