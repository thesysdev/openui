import type { ScaleBand, ScalePoint } from "d3-scale";
import React from "react";

const X_AXIS_TOP_GAP = 4;

type AngledXAxisScale = ScaleBand<string> | ScalePoint<string>;

function isBandScale(scale: AngledXAxisScale): scale is ScaleBand<string> {
  return typeof (scale as ScaleBand<string>).paddingInner === "function";
}

interface AngledXAxisProps {
  scale: AngledXAxisScale;
  angle: number;
  classPrefix: string;
}

export const AngledXAxis: React.FC<AngledXAxisProps> = ({ scale, angle, classPrefix }) => {
  const domain = scale.domain();
  const band = isBandScale(scale);
  const isAngled = angle !== 0;

  return (
    <g className={`${classPrefix}-x-axis`}>
      {domain.map((category) => {
        const rawX = scale(category) ?? 0;
        const x = band ? rawX + (scale as ScaleBand<string>).bandwidth() / 2 : rawX;
        const y = X_AXIS_TOP_GAP;

        return (
          <text
            key={category}
            x={x}
            y={y}
            textAnchor={isAngled ? "end" : "middle"}
            dominantBaseline="hanging"
            className={`${classPrefix}-x-tick-angled`}
            transform={isAngled ? `rotate(${angle}, ${x}, ${y})` : undefined}
          >
            {String(category)}
          </text>
        );
      })}
    </g>
  );
};
