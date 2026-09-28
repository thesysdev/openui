import type { ScaleLinear } from "d3-scale";
import React from "react";
import { numberTickFormatter } from "../../../utils/styleUtils";

interface NumericXAxisProps {
  scale: ScaleLinear<number, number>;
  chartWidth: number;
  height: number;
  className?: string;
  tickClassName?: string;
  /**
   * When true, the FIRST tick label is `text-anchor: start` and the LAST is
   * `end` (rest stay centred) so the edge labels don't clip off the chart
   * without insetting the scale (which would push the edge gridline into the
   * category labels). Default false — keeps existing callers byte-identical.
   */
  edgeAlign?: boolean;
}

const MIN_TICK_SPACING = 60;

export const NumericXAxis: React.FC<NumericXAxisProps> = ({
  scale,
  chartWidth,
  height,
  className,
  tickClassName,
  edgeAlign = false,
}) => {
  const tickCount = Math.max(2, Math.floor(chartWidth / MIN_TICK_SPACING));
  const ticks = scale.ticks(tickCount);

  return (
    <g className={className}>
      {ticks.map((tick, i) => {
        const anchor = edgeAlign
          ? i === 0
            ? "start"
            : i === ticks.length - 1
              ? "end"
              : "middle"
          : "middle";
        return (
          <text
            key={tick}
            className={tickClassName}
            x={scale(tick)}
            y={height / 2}
            textAnchor={anchor}
            dominantBaseline="middle"
          >
            {numberTickFormatter(tick)}
          </text>
        );
      })}
    </g>
  );
};
