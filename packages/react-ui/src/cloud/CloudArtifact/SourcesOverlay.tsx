"use client";

import clsx from "clsx";
import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { names as artifactNames } from "./cloudArtifact.styles";
import { popoverNames, popoverStyles } from "./sourcesPopover.styles";

/** How far the cut-out stands clear of the component's box: past its outline (4 to 6px out). */
const PAD = 8;
/** The cut-out's corner radius, at most half its shorter side. */
const RADIUS = 12;

interface Size {
  width: number;
  height: number;
}
interface Box extends Size {
  x: number;
  y: number;
}

const n = (value: number) => String(Math.round(value * 100) / 100);

/**
 * The overlay's `clip-path`: its whole box, less a rounded hole, both in its own coordinates.
 * Even-odd fill leaves the hole out; an empty hole leaves the box whole.
 */
export function cutoutPath(outer: Size, hole: Box): string {
  const whole = `M0 0H${n(outer.width)}V${n(outer.height)}H0Z`;
  if (hole.width <= 0 || hole.height <= 0) return `path(evenodd, "${whole}")`;
  const { x, y, width: w, height: h } = hole;
  const r = Math.min(RADIUS, w / 2, h / 2);
  const arc = (toX: number, toY: number) => `A${n(r)} ${n(r)} 0 0 1 ${n(toX)} ${n(toY)}`;
  const rounded =
    `M${n(x + r)} ${n(y)}H${n(x + w - r)}${arc(x + w, y + r)}` +
    `V${n(y + h - r)}${arc(x + w - r, y + h)}` +
    `H${n(x + r)}${arc(x, y + h - r)}` +
    `V${n(y + r)}${arc(x + r, y)}Z`;
  return `path(evenodd, "${whole}${rounded}")`;
}

/** The component's box, padded, in the overlay's coordinates and kept inside it. */
function holeIn(outer: DOMRect, box: DOMRect): Box {
  const left = Math.max(box.left - PAD - outer.left, 0);
  const top = Math.max(box.top - PAD - outer.top, 0);
  const right = Math.min(box.right + PAD - outer.left, outer.width);
  const bottom = Math.min(box.bottom + PAD - outer.top, outer.height);
  return { x: left, y: top, width: Math.max(right - left, 0), height: Math.max(bottom - top, 0) };
}

const nextFrame = (run: () => void): (() => void) => {
  if (typeof requestAnimationFrame === "function") {
    const frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }
  const timer = setTimeout(run, 16);
  return () => clearTimeout(timer);
};

/**
 * While a Sources popover shows: a blur over the artifact's content that lightens it, with a
 * clear rounded cut-out over the component, so the component stays sharp however deeply it is
 * nested. It is fixed over the content's box and redrawn on any scroll, a window resize and a
 * resize of the content or the component. A click on it closes the popover; the cut-out lets
 * clicks through to the component.
 */
export function SourcesOverlay({
  anchor,
  open,
  themeClassName,
  onDismiss,
}: {
  anchor: Element;
  open: boolean;
  themeClassName?: string;
  onDismiss: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const area = anchor.closest(`.${artifactNames.content}`);
    const update = () => {
      const outer = area
        ? area.getBoundingClientRect()
        : new DOMRect(0, 0, window.innerWidth, window.innerHeight);
      const hole = holeIn(outer, anchor.getBoundingClientRect());
      const { style } = element;
      style.left = `${n(outer.left)}px`;
      style.top = `${n(outer.top)}px`;
      style.width = `${n(outer.width)}px`;
      style.height = `${n(outer.height)}px`;
      style.setProperty("clip-path", cutoutPath(outer, hole));
    };
    update();
    // One redraw a frame, however many events come in it.
    let cancel: (() => void) | null = null;
    const schedule = () => {
      cancel ??= nextFrame(() => {
        cancel = null;
        update();
      });
    };
    // Scroll events don't bubble, but every one passes the window on its capture phase.
    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule);
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null;
    observer?.observe(anchor);
    if (area) observer?.observe(area);
    return () => {
      cancel?.();
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    };
  }, [anchor]);

  return createPortal(
    <div
      ref={ref}
      className={clsx(popoverStyles.overlay, popoverNames.overlay, themeClassName)}
      data-openui-sources-overlay=""
      data-state={open ? "open" : "closed"}
      aria-hidden
      onClick={open ? onDismiss : undefined}
    />,
    document.body,
  );
}
