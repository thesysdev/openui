import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { DevtoolsPosition } from "../types";

/** Pointer travel (px) before a press on the launcher counts as a drag. */
const DRAG_THRESHOLD = 4;

/** The viewport quadrant a point falls in. */
export function cornerAt(x: number, y: number, width: number, height: number): DevtoolsPosition {
  const vertical = y < height / 2 ? "top" : "bottom";
  const horizontal = x < width / 2 ? "left" : "right";
  return `${vertical}-${horizontal}`;
}

/**
 * Drag-to-snap for the launcher: follows the pointer while dragging and, on
 * release, reports the quadrant it was dropped in. A press that never passes
 * the threshold stays a click; the click that ends a drag is swallowed.
 */
export function useCornerDrag(onSnap: (corner: DevtoolsPosition) => void) {
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const dragged = useRef(false);
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    start.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    dragged.current = false;
    // Keep receiving moves once the pointer outruns the 40px button.
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const origin = start.current;
    if (!origin || origin.id !== event.pointerId) return;
    const x = event.clientX - origin.x;
    const y = event.clientY - origin.y;
    if (!dragged.current) {
      if (Math.hypot(x, y) < DRAG_THRESHOLD) return;
      dragged.current = true;
    }
    setOffset({ x, y });
  };

  const end = (event: ReactPointerEvent<HTMLElement>, snap: boolean) => {
    const origin = start.current;
    if (!origin || origin.id !== event.pointerId) return;
    start.current = null;
    setOffset(null);
    if (snap && dragged.current) {
      onSnap(cornerAt(event.clientX, event.clientY, window.innerWidth, window.innerHeight));
    }
  };

  /** True (once) when the click being handled is the tail of a drag. */
  const consumeDrag = () => {
    const wasDrag = dragged.current;
    dragged.current = false;
    return wasDrag;
  };

  return {
    dragging: offset !== null,
    offset,
    consumeDrag,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: ReactPointerEvent<HTMLElement>) => end(event, true),
      onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => end(event, false),
    },
  };
}
