import type { ScaleLinear } from "d3-scale";

import type { ChartData } from "../../types";
import { radarAxisAngle } from "../../utils/polarUtils";

interface RadarSeriesProps<T extends ChartData> {
  data: T;
  dataKeys: string[];
  catKey: string;
  radialScale: ScaleLinear<number, number>;
  numAxes: number;
  colorMap: Record<string, string>;
  fillOpacity: number;
  showDots: boolean;
  dotRadius: number;
  hoveredIndex: number | null;
  isAnimationActive: boolean;
  isPrinting: boolean;
}

function computeVertices(
  data: ChartData,
  key: string,
  numAxes: number,
  radialScale: ScaleLinear<number, number>,
): Array<{ x: number; y: number }> {
  return data.map((row, i) => {
    const angle = radarAxisAngle(i, numAxes);
    const r = radialScale(Number(row[key]) || 0);
    return { x: r * Math.cos(angle), y: r * Math.sin(angle) };
  });
}

export function RadarSeries<T extends ChartData>({
  data,
  dataKeys,
  catKey: _catKey,
  radialScale,
  numAxes,
  colorMap,
  fillOpacity,
  showDots,
  dotRadius,
  hoveredIndex,
  isAnimationActive,
  isPrinting,
}: RadarSeriesProps<T>) {
  const shouldAnimate = isAnimationActive && !isPrinting;

  return (
    <g className="openui-d3-radar-chart-series">
      {dataKeys.map((key, seriesIdx) => {
        const color = colorMap[key] ?? "#000";
        const vertices = computeVertices(data, key, numAxes, radialScale);
        const points = vertices.map((v) => `${v.x},${v.y}`).join(" ");

        const animationClass = shouldAnimate ? "openui-d3-radar-chart-polygon--animated" : "";
        const animationDelay = shouldAnimate ? `${seriesIdx * 80}ms` : undefined;

        return (
          <g key={key}>
            <polygon
              points={points}
              fill={color}
              fillOpacity={fillOpacity}
              className={`openui-d3-radar-chart-polygon-area ${animationClass}`}
              style={{ animationDelay }}
            />
            <polygon
              points={points}
              className={`openui-d3-radar-chart-polygon-stroke ${animationClass}`}
              stroke={color}
              style={{ animationDelay }}
            />
            {showDots &&
              vertices.map((v, i) => {
                const isHoveredAxis = hoveredIndex === i;
                const r = isHoveredAxis ? dotRadius * 1.5 : dotRadius;
                const opacity = hoveredIndex !== null && !isHoveredAxis ? 0.3 : 1;

                return (
                  <circle
                    key={i}
                    cx={v.x}
                    cy={v.y}
                    r={r}
                    fill={color}
                    className="openui-d3-radar-chart-dot"
                    style={{ opacity }}
                  />
                );
              })}
          </g>
        );
      })}
    </g>
  );
}
