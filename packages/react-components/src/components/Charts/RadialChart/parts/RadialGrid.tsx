"use client";

import clsx from "clsx";
import { names, radialChartStyles } from "../radialChart.styles";
interface RadialGridProps {
  maxRadius: number;
  minRadius: number;
  gridLevels?: number;
  startAngle: number;
  endAngle: number;
}

export function RadialGrid({
  maxRadius,
  minRadius,
  gridLevels = 5,
  startAngle,
  endAngle,
}: RadialGridProps) {
  const styles = radialChartStyles;
  const isSemiCircular = endAngle - startAngle < 2 * Math.PI;

  return (
    <g className={names.grid}>
      {Array.from({ length: gridLevels }, (_, i) => {
        const fraction = (i + 1) / gridLevels;
        const r = minRadius + (maxRadius - minRadius) * fraction;

        if (isSemiCircular) {
          const x1 = r * Math.cos(startAngle - Math.PI / 2);
          const y1 = r * Math.sin(startAngle - Math.PI / 2);
          const x2 = r * Math.cos(endAngle - Math.PI / 2);
          const y2 = r * Math.sin(endAngle - Math.PI / 2);
          // SVG arc large-arc-flag: use long arc when sweep > 180 degrees
          const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

          return (
            <path
              key={i}
              d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
              fill="none"
              className={clsx(styles.gridCircle, names.gridCircle)}
            />
          );
        }

        return (
          <circle
            key={i}
            cx={0}
            cy={0}
            r={r}
            fill="none"
            className={clsx(styles.gridCircle, names.gridCircle)}
          />
        );
      })}
    </g>
  );
}
