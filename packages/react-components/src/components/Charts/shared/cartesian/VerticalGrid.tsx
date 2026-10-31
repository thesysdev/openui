"use client";

import type { ScaleLinear } from "d3-scale";
import React from "react";

const DEFAULT_MIN_TICK_SPACING = 60;

interface VerticalGridProps {
  xScale: ScaleLinear<number, number>;
  chartWidth: number;
  chartHeight: number;
  className?: string;
  lineClassName?: string;
  minTickSpacing?: number;
}

export const VerticalGrid: React.FC<VerticalGridProps> = ({
  xScale,
  chartWidth,
  chartHeight,
  className,
  lineClassName,
  minTickSpacing = DEFAULT_MIN_TICK_SPACING,
}) => {
  const tickCount = Math.max(2, Math.floor(chartWidth / minTickSpacing));
  const ticks = xScale.ticks(tickCount);

  return (
    <g className={className}>
      {ticks.map((t) => (
        <line
          className={lineClassName}
          key={t}
          x1={xScale(t)}
          x2={xScale(t)}
          y1={0}
          y2={chartHeight}
        />
      ))}
    </g>
  );
};
