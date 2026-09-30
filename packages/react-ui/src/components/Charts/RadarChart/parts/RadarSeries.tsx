import type { ScaleLinear } from "d3-scale";

import type { ChartData } from "../../types";
import { CHART_CLASS_PREFIX } from "../../utils/constants";
import { entranceProps } from "../../utils/entranceUtils";
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
  /** Pre-folded "animation on AND not printing" — computed at the chart entry via useEffectiveAnimation. */
  animate: boolean;
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
  animate,
}: RadarSeriesProps<T>) {
  const series = dataKeys.map((key) => ({
    key,
    color: colorMap[key] ?? "#000",
    vertices: computeVertices(data, key, numAxes, radialScale),
  }));
  // The hovered axis gets an active dot where each series crosses it (the
  // Recharts radar's activeDot). Vertex dots, when on, show the hover themselves.
  const activeAxis = showDots ? null : hoveredIndex;

  return (
    <g className={`${CHART_CLASS_PREFIX}-radar-chart-series`}>
      {series.map(({ key, color, vertices }, seriesIdx) => {
        const points = vertices.map((v) => `${v.x},${v.y}`).join(" ");

        const { className: animationClass, animationDelay } = entranceProps(
          animate,
          `${CHART_CLASS_PREFIX}-radar-chart-polygon--animated`,
          seriesIdx * 80,
        );

        return (
          <g key={key}>
            <polygon
              points={points}
              fill={color}
              fillOpacity={fillOpacity}
              className={`${CHART_CLASS_PREFIX}-radar-chart-polygon-area ${animationClass}`}
              style={{ animationDelay }}
            />
            <polygon
              points={points}
              className={`${CHART_CLASS_PREFIX}-radar-chart-polygon-stroke ${animationClass}`}
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
                    className={`${CHART_CLASS_PREFIX}-radar-chart-dot`}
                    style={{ opacity }}
                  />
                );
              })}
          </g>
        );
      })}
      {activeAxis !== null && (
        <g className={`${CHART_CLASS_PREFIX}-radar-chart-active-dots`}>
          {series.map(({ key, color, vertices }) => {
            const v = vertices[activeAxis];
            if (!v) return null;
            return (
              <g key={key} transform={`translate(${v.x}, ${v.y})`}>
                <circle r={4} className={`${CHART_CLASS_PREFIX}-radar-chart-active-dot-outer`} />
                <circle
                  r={2}
                  fill={color}
                  className={`${CHART_CLASS_PREFIX}-radar-chart-active-dot-inner`}
                />
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
}
