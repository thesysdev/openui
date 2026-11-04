import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { DevtoolsPosition } from "../types";

/** Pointer travel (px) before a press on the launcher counts as a drag. */
const DRAG_THRESHOLD = 4;
const SNAP_TRANSITION = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)";

/** Drags within this angle (22.5°) of an axis only switch that axis. */
const AXIS_RATIO = Math.tan(Math.PI / 8);

/**
 * The corner a drag from `from` heads toward. Each axis switches side when
 * the drag moves toward the other side, so a short flick is enough.
 */
export function cornerToward(from: DevtoolsPosition, dx: number, dy: number): DevtoolsPosition {
  let vertical = from.startsWith("top") ? "top" : "bottom";
  let horizontal = from.endsWith("left") ? "left" : "right";
  if (Math.abs(dy) > Math.abs(dx) * AXIS_RATIO) {
    if (dy > 0) vertical = "bottom";
    else if (dy < 0) vertical = "top";
  }
  if (Math.abs(dx) > Math.abs(dy) * AXIS_RATIO) {
    if (dx > 0) horizontal = "right";
    else if (dx < 0) horizontal = "left";
  }
  return `${vertical}-${horizontal}` as DevtoolsPosition;
}

/**
 * Drag-to-snap for the launcher. While dragging, the element behind `ref`
 * follows the pointer (written straight to the DOM, so the widget doesn't
 * re-render per move). On release it reports the corner it was dragged
 * toward and glides from the drop point into that corner. A press that never passes
 * the threshold stays a click; the click that ends a drag is swallowed.
 */
export function useCornerDrag(
  corner: DevtoolsPosition,
  onSnap: (corner: DevtoolsPosition) => void,
) {
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef<{
    x: number;
    y: number;
    pressX: number;
    pressY: number;
    id: number;
  } | null>(null);
  const dragged = useRef(false);
  const frame = useRef(0);
  const dropRect = useRef<DOMRect | null>(null);
  const [dragging, setDragging] = useState(false);

  // After the drop re-render has moved the launcher to its new corner, start
  // it back at the drop point and transition the difference away (FLIP).
  useLayoutEffect(() => {
    const el = ref.current;
    const from = dropRect.current;
    if (!el || !from) return;
    dropRect.current = null;
    el.style.transition = "none";
    el.style.transform = "";
    const to = el.getBoundingClientRect();
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      el.style.transform = "";
      return;
    }
    void el.offsetWidth;
    el.style.transition = SNAP_TRANSITION;
    el.style.transform = "";
  });

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    start.current = {
      x: event.clientX,
      y: event.clientY,
      pressX: event.clientX,
      pressY: event.clientY,
      id: event.pointerId,
    };
    dragged.current = false;
    // Keep receiving moves once the pointer outruns the 40px button.
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const origin = start.current;
    const el = ref.current;
    if (!origin || !el || origin.id !== event.pointerId) return;
    if (!dragged.current) {
      if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) < DRAG_THRESHOLD) return;
      dragged.current = true;
      setDragging(true);
      // Pick it up from where it is on screen, even mid-glide.
      const { m41, m42 } = new DOMMatrix(getComputedStyle(el).transform);
      origin.x -= m41;
      origin.y -= m42;
    }
    const x = event.clientX - origin.x;
    const y = event.clientY - origin.y;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.transition = "none";
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  };

  const end = (event: ReactPointerEvent<HTMLElement>, snap: boolean) => {
    const origin = start.current;
    const el = ref.current;
    if (!origin || origin.id !== event.pointerId) return;
    start.current = null;
    cancelAnimationFrame(frame.current);
    if (!dragged.current || !el) return;
    setDragging(false);
    dropRect.current = el.getBoundingClientRect();
    if (snap) {
      onSnap(cornerToward(corner, event.clientX - origin.pressX, event.clientY - origin.pressY));
    }
  };

  /** True (once) when the click being handled is the tail of a drag. */
  const consumeDrag = () => {
    const wasDrag = dragged.current;
    dragged.current = false;
    return wasDrag;
  };

  return {
    ref,
    dragging,
    consumeDrag,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: ReactPointerEvent<HTMLElement>) => end(event, true),
      onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => end(event, false),
    },
  };
}
