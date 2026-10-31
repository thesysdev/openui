"use client";

import clsx from "clsx";
import type { ScaleLinear } from "d3-scale";
import type { CSSProperties } from "react";
import { FadeFollower } from "../../shared/core/spring";
import type { ChartData } from "../../types";
import { entranceProps } from "../../utils/entranceUtils";
import { radarAxisAngle } from "../../utils/polarUtils";
import { names, radarChartStyles } from "../radarChart.styles";

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
  const styles = radarChartStyles;
  const series = dataKeys.map((key) => ({
    key,
    color: colorMap[key] ?? "#000",
    vertices: computeVertices(data, key, numAxes, radialScale),
  }));

  return (
    <g className={names.series}>
      {series.map(({ key, color, vertices }, seriesIdx) => {
        const points = vertices.map((v) => `${v.x},${v.y}`).join(" ");

        const { className: animationClass, animationDelay } = entranceProps(
          animate,
          clsx(styles.polygonIsAnimationActive, names.polygonIsAnimationActive),
          seriesIdx * 80,
        );

        return (
          <g className={names.group} key={key}>
            <polygon
              points={points}
              fill={color}
              fillOpacity={fillOpacity}
              className={clsx(styles.polygonArea, names.polygonArea, names.polygon, animationClass)}
              style={
                {
                  "--_openui-radar-chart-polygon-animation-delay": animationDelay,
                } as CSSProperties
              }
            />
            <polygon
              points={points}
              className={clsx(
                styles.polygonStroke,
                names.polygonStroke,
                names.polygon,
                animationClass,
              )}
              stroke={color}
              style={
                {
                  "--_openui-radar-chart-polygon-animation-delay": animationDelay,
                } as CSSProperties
              }
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
                    className={clsx(styles.dot, names.dot)}
                    style={{ "--_openui-radar-chart-dot-opacity": opacity } as CSSProperties}
                  />
                );
              })}
          </g>
        );
      })}
      {/* The hovered axis gets an active dot where each series crosses it (the
          Recharts radar's activeDot). Like the line/area crosshair dots they stay
          mounted, glide from axis to axis and fade in and out. Vertex dots, when
          on, show the hover themselves. */}
      {!showDots && (
        <g className={clsx(styles.activeDots, names.activeDots)}>
          {series.map(({ key, color, vertices }) => {
            const v = hoveredIndex !== null ? vertices[hoveredIndex] : undefined;
            return (
              <FadeFollower key={key} x={v?.x ?? 0} y={v?.y ?? 0} visible={v !== undefined}>
                <circle r={4} className={clsx(styles.activeDotOuter, names.activeDotOuter)} />
                <circle
                  r={2}
                  fill={color}
                  className={clsx(styles.activeDotInner, names.activeDotInner)}
                />
              </FadeFollower>
            );
          })}
        </g>
      )}
    </g>
  );
}
