import type { ChartData } from "../../types";
import { radarAxisAngle, radarLabelAnchor } from "../../utils/polarUtils";

interface RadarAxisLabelsProps<T extends ChartData> {
  data: T;
  catKey: string;
  numAxes: number;
  maxRadius: number;
  labelPadding?: number;
}

export function RadarAxisLabels<T extends ChartData>({
  data,
  catKey,
  numAxes,
  maxRadius,
  labelPadding = 16,
}: RadarAxisLabelsProps<T>) {
  const r = maxRadius + labelPadding;

  return (
    <g className="openui-d3-radar-chart-axis-labels">
      {data.map((row, i) => {
        const angle = radarAxisAngle(i, numAxes);
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);
        const anchor = radarLabelAnchor(angle);

        const sinAngle = Math.sin(angle);
        let baseline: "auto" | "middle" | "hanging" = "middle";
        if (sinAngle < -0.3) baseline = "auto";
        else if (sinAngle > 0.3) baseline = "hanging";

        return (
          <text
            key={String(row[catKey])}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline={baseline}
            className="openui-d3-radar-chart-axis-label"
          >
            {String(row[catKey])}
          </text>
        );
      })}
    </g>
  );
}
