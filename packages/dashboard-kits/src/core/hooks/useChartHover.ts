import { pointer } from "d3-selection";
import { useCallback, useState, type KeyboardEvent, type PointerEvent } from "react";

interface HoverState {
  hovered: number | null;
  /** The last index hovered, kept after the pointer leaves. */
  resting: number | null;
}

/**
 * The hovered data index of a chart, as react-ui's `useChartHover` tracks it:
 * the pointer is resolved to chart coordinates with d3's `pointer`, and the
 * chart's own `findIndex` maps that to a point or band. Arrow keys walk the
 * points for keyboard readers; Escape, blur, and leaving clear it.
 *
 * Only the index lives in React state, and it changes once per point crossed,
 * not once per pointer move: everything that moves continuously (the
 * crosshair, the dots, the tooltip) follows on springs off the render path.
 * `restingIndex` keeps the last hovered index, so an always-mounted follower
 * fades out where it was and glides in from there on the next hover.
 */
export function useChartHover(count: number) {
  const [state, setState] = useState<HoverState>({ hovered: null, resting: null });

  const setHoveredIndex = useCallback(
    (next: number | null | ((h: number | null) => number | null)) => {
      setState((prev) => {
        const hovered = typeof next === "function" ? next(prev.hovered) : next;
        if (hovered === prev.hovered) return prev;
        return { hovered, resting: hovered ?? prev.resting };
      });
    },
    [],
  );

  const createHandlers = useCallback(
    (findIndex: (x: number, y: number) => number | null) => ({
      onPointerMove: (event: PointerEvent<Element>) => {
        const [x, y] = pointer(event.nativeEvent, event.currentTarget);
        setHoveredIndex(findIndex(x, y));
      },
      onPointerLeave: () => setHoveredIndex(null),
      onBlur: () => setHoveredIndex(null),
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === "ArrowRight") setHoveredIndex((h) => Math.min(count - 1, (h ?? -1) + 1));
        else if (event.key === "ArrowLeft") setHoveredIndex((h) => Math.max(0, (h ?? count) - 1));
        else if (event.key === "Escape") setHoveredIndex(null);
        else return;
        event.preventDefault();
      },
    }),
    [count, setHoveredIndex],
  );

  return {
    hoveredIndex: state.hovered,
    restingIndex: state.resting,
    setHoveredIndex,
    createHandlers,
  };
}
