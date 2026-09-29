import React, { useCallback, useState } from "react";

/**
 * Per-element hover state for the charts where each element reports its own
 * identity on mouseover — funnel stages, pie/radial slices, heatmap cells. The
 * painter passes the hovered item straight in (`handleMouseMove(event, item)`),
 * so there's no hit-testing here.
 *
 * This is the counterpart to {@link useChartHover}, the position-based regime
 * where an SVG-level `findIndex(x, y)` resolves the index from the pointer
 * (radar, scatter, the cartesian line charts) — do not conflate the two.
 *
 * `T` defaults to `number` (the element index, used by funnel and the
 * categorical pie/radial); heatmap passes its richer `HoveredHeatmapCell`.
 */
export function usePerElementHover<T = number>() {
  const [hovered, setHovered] = useState<T | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback((event: React.MouseEvent, item: T) => {
    setHovered(item);
    setMousePos({ x: event.clientX, y: event.clientY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(null);
    setMousePos(null);
  }, []);

  return { hovered, mousePos, handleMouseMove, handleMouseLeave };
}
