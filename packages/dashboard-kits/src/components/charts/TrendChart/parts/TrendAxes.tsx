import type { ValueFormat } from "../../../../core/schemas";
import { KIT_CHART_PREFIX } from "../../utils/constants";
import { formatAxis } from "../../utils/format";

const P = `${KIT_CHART_PREFIX}-trend-chart`;

/** Horizontal gridlines with their value labels, and the x labels along the bottom. */
export function TrendAxes({
  ticks,
  y,
  left,
  right,
  height,
  format,
  labels,
  xTicks,
  x,
}: {
  ticks: number[];
  y: (value: number) => number;
  left: number;
  right: number;
  height: number;
  format: ValueFormat;
  labels: string[];
  xTicks: number[];
  x: (index: number) => number;
}) {
  const last = labels.length - 1;
  return (
    <g className={`${P}-axes`}>
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={left}
            x2={right}
            y1={y(tick)}
            y2={y(tick)}
            className={tick === 0 ? `${P}-baseline` : `${P}-grid`}
          />
          <text x={left - 8} y={y(tick) + 4} textAnchor="end" className={`${P}-tick`}>
            {formatAxis(tick, format)}
          </text>
        </g>
      ))}
      {xTicks.map((i) => (
        <text
          key={i}
          x={x(i)}
          y={height - 6}
          textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
          className={`${P}-tick`}
        >
          {labels[i]}
        </text>
      ))}
    </g>
  );
}
