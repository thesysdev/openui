import type { ScaleLinear } from "d3-scale";
import React from "react";
import { numberTickFormatter } from "../../utils/styleUtils";

interface NumericXAxisProps {
  scale: ScaleLinear<number, number>;
  chartWidth: number;
  height: number;
  className?: string;
  tickClassName?: string;
}

const MIN_TICK_SPACING = 60;

export const NumericXAxis: React.FC<NumericXAxisProps> = ({
  scale,
  chartWidth,
  height,
  className,
  tickClassName,
}) => {
  const tickCount = Math.max(2, Math.floor(chartWidth / MIN_TICK_SPACING));
  const ticks = scale.ticks(tickCount);

  return (
    <g className={className}>
      {ticks.map((tick) => (
        <text
          key={tick}
          className={tickClassName}
          x={scale(tick)}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {numberTickFormatter(tick)}
        </text>
      ))}
    </g>
  );
};
