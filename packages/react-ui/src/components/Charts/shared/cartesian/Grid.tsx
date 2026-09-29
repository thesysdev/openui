import type { ScaleLinear } from "d3-scale";
import React from "react";

import { CHART_CLASS_PREFIX, resolveTickCount } from "../../utils/constants";

interface GridProps {
  yScale: ScaleLinear<number, number>;
  chartWidth: number;
  chartHeight: number;
  className?: string;
  /**
   * Optional y-tick-count hint. When provided it wins (floored at 2) over the
   * height-derived default. MUST match the value passed to the sibling `YAxis`
   * so gridlines and labels stay aligned.
   */
  tickCount?: number;
}

export const Grid: React.FC<GridProps> = ({
  yScale,
  chartWidth,
  chartHeight,
  className,
  tickCount: tickCountOverride,
}) => {
  const tickCount = resolveTickCount(chartHeight, tickCountOverride);
  const ticks = yScale.ticks(tickCount);
  // Emphasize the zero baseline only when the domain actually spans negatives —
  // for all-positive charts tick 0 sits at the chart bottom and must stay a
  // regular (dashed) gridline, pixel-identical to before negative support.
  const spansNegative = (yScale.domain()[0] ?? 0) < 0;

  return (
    <g className={className}>
      {ticks.map((tick) => (
        <line
          key={tick}
          className={
            spansNegative && tick === 0 ? `${CHART_CLASS_PREFIX}-grid-zero-line` : undefined
          }
          x1={0}
          x2={chartWidth}
          y1={yScale(tick)}
          y2={yScale(tick)}
        />
      ))}
    </g>
  );
};
