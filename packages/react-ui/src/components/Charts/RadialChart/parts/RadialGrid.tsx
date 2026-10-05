import { CHART_CLASS_PREFIX } from "../../utils/constants";

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
  const isSemiCircular = endAngle - startAngle < 2 * Math.PI;

  return (
    <g className={`${CHART_CLASS_PREFIX}-radial-chart-grid`}>
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
              className={`${CHART_CLASS_PREFIX}-radial-chart-grid-circle`}
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
            className={`${CHART_CLASS_PREFIX}-radial-chart-grid-circle`}
          />
        );
      })}
    </g>
  );
}
