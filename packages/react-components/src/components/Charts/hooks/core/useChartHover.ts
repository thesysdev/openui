import { pointer } from "d3-selection";
import React, { useCallback, useState } from "react";

import type { ChartData } from "../../types";

export interface UseChartHoverParams<T extends ChartData> {
  data: T;
  onClick?: (row: T[number], index: number) => void;
}

export function useChartHover<T extends ChartData>({ data, onClick }: UseChartHoverParams<T>) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const createMouseHandlers = useCallback(
    // 2D on purpose: radar's angular hit-test needs (x, y); cartesian callers
    // pass 1-arg findIndex functions, which are assignable (TS arity
    // contravariance) — this replaced a 95%-verbatim useRadarHover fork.
    (findIndex: (mouseX: number, mouseY: number) => number) => {
      const handleMouseMove = (event: React.MouseEvent<SVGElement>) => {
        const [mouseX, mouseY] = pointer(event.nativeEvent, event.currentTarget);
        setHoveredIndex(findIndex(mouseX, mouseY));
        setMousePos({ x: event.clientX, y: event.clientY });
      };

      const handleMouseLeave = () => {
        setHoveredIndex(null);
        setMousePos(null);
      };

      const handleTouchMove = (event: React.TouchEvent<SVGElement>) => {
        const touch = event.touches[0];
        if (!touch) return;
        const svgRect = event.currentTarget.getBoundingClientRect();
        const mouseX = touch.clientX - svgRect.left;
        const mouseY = touch.clientY - svgRect.top;
        setHoveredIndex(findIndex(mouseX, mouseY));
        setMousePos({ x: touch.clientX, y: touch.clientY });
      };

      const handleTouchEnd = () => {
        setHoveredIndex(null);
        setMousePos(null);
      };

      const handleClick = onClick
        ? (event: React.MouseEvent<SVGElement>) => {
            const [mouseX, mouseY] = pointer(event.nativeEvent, event.currentTarget);
            const idx = findIndex(mouseX, mouseY);
            if (idx >= 0 && idx < data.length) {
              onClick(data[idx]!, idx);
            }
          }
        : undefined;

      return {
        handleMouseMove,
        handleMouseLeave,
        handleTouchMove,
        handleTouchEnd,
        handleClick,
      };
    },
    [onClick, data],
  );

  return {
    hoveredIndex,
    mousePos,
    createMouseHandlers,
  };
}
