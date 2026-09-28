import type { ScaleLinear } from "d3-scale";
import React from "react";
import { resolveTickCount } from "../../../utils/constants";
import { numberTickFormatter } from "../../../utils/styleUtils";

interface YAxisProps {
  scale: ScaleLinear<number, number>;
  width: number;
  chartHeight: number;
  className?: string;
  tickClassName?: string;
  /**
   * Optional y-tick-count hint. When provided it wins (floored at 2) over the
   * height-derived default. MUST match the value passed to the sibling `Grid`
   * so labels and gridlines stay aligned.
   */
  tickCount?: number;
}

export const YAxis: React.FC<YAxisProps> = ({
  scale,
  width,
  chartHeight,
  className,
  tickClassName,
  tickCount: tickCountOverride,
}) => {
  const tickCount = resolveTickCount(chartHeight, tickCountOverride);
  const ticks = scale.ticks(tickCount);

  return (
    <g className={className}>
      {ticks.map((tick) => (
        <text
          key={tick}
          className={tickClassName}
          x={width - 8}
          y={scale(tick)}
          textAnchor="end"
          dominantBaseline="middle"
        >
          {numberTickFormatter(tick)}
        </text>
      ))}
    </g>
  );
};
