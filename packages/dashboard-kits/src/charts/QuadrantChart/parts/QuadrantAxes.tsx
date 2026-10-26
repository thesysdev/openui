import { KIT_CHART_PREFIX } from "../../utils/constants";
import type { Quadrant, QuadrantAxis } from "../types";

const P = `${KIT_CHART_PREFIX}-quadrant`;

/**
 * Gridlines and ticks for both axes, the split lines, the shaded high-high
 * quadrant, each quadrant's name in its corner, and the axis titles.
 */
export function QuadrantAxes({
  x,
  y,
  xAxis,
  yAxis,
  splitX,
  splitY,
  quadrants,
  left,
  right,
  top,
  bottom,
  height,
}: {
  x: (value: number) => number;
  y: (value: number) => number;
  xAxis: QuadrantAxis;
  yAxis: QuadrantAxis;
  splitX: number;
  splitY: number;
  quadrants: Record<Quadrant, string>;
  left: number;
  right: number;
  top: number;
  bottom: number;
  height: number;
}) {
  const midY = (top + bottom) / 2;
  return (
    <g className={`${P}-axes`}>
      <rect
        x={x(splitX)}
        y={top}
        width={right - x(splitX)}
        height={y(splitY) - top}
        className={`${P}-lead`}
      />
      {xAxis.ticks.map((t) => (
        <text key={t} x={x(t)} y={bottom + 16} className={`${P}-tick`} textAnchor="middle">
          {xAxis.format(t)}
        </text>
      ))}
      {yAxis.ticks.map((t) => (
        <g key={t}>
          <line
            x1={left}
            x2={right}
            y1={y(t)}
            y2={y(t)}
            className={t === yAxis.domain[0] ? `${P}-baseline` : `${P}-grid`}
          />
          <text x={left - 8} y={y(t) + 4} className={`${P}-tick`} textAnchor="end">
            {yAxis.format(t)}
          </text>
        </g>
      ))}
      <line x1={x(splitX)} x2={x(splitX)} y1={top} y2={bottom} className={`${P}-median`} />
      <line x1={left} x2={right} y1={y(splitY)} y2={y(splitY)} className={`${P}-median`} />
      <text x={right - 6} y={top + 14} textAnchor="end" className={`${P}-name`}>
        {quadrants.highHigh}
      </text>
      <text x={left + 8} y={top + 14} className={`${P}-name`}>
        {quadrants.lowHigh}
      </text>
      <text x={right - 6} y={bottom - 8} textAnchor="end" className={`${P}-name`}>
        {quadrants.highLow}
      </text>
      <text x={left + 8} y={bottom - 8} className={`${P}-name`}>
        {quadrants.lowLow}
      </text>
      <text x={(left + right) / 2} y={height - 4} textAnchor="middle" className={`${P}-title`}>
        {xAxis.title}
      </text>
      <text
        x={12}
        y={midY}
        textAnchor="middle"
        className={`${P}-title`}
        transform={`rotate(-90 12 ${midY})`}
      >
        {yAxis.title}
      </text>
    </g>
  );
}
