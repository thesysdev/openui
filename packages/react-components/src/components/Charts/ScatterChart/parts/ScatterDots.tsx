"use client";

import type { ScaleLinear } from "d3-scale";
import React from "react";

import clsx from "clsx";
import type { VisibleDataset } from "../../hooks/cartesian/useScatterChartOrchestrator";
import { entranceProps } from "../../utils/entranceUtils";
import { names, scatterChartStyles } from "../scatterChart.styles";
import type { HoveredScatterPoint } from "../types";

interface ScatterDotsProps {
  datasets: VisibleDataset[];
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  colorMap: Record<string, string>;
  dotRadius: number;
  hoveredPoint: HoveredScatterPoint | null;
  /** Pre-folded "animation on AND not printing" — computed at the chart entry via useEffectiveAnimation. */
  animate: boolean;
}

export const ScatterDots: React.FC<ScatterDotsProps> = ({
  datasets,
  xScale,
  yScale,
  colorMap,
  dotRadius,
  hoveredPoint,
  animate,
}) => {
  const styles = scatterChartStyles;
  return (
    <g className={names.dots}>
      {datasets.map(({ dataset: ds, originalIndex }) => {
        const color = colorMap[ds.name] ?? "#000";
        const isHoveredDataset = hoveredPoint?.datasetName === ds.name;
        const hasHover = hoveredPoint !== null;

        return (
          <g className={names.group} key={ds.name}>
            {ds.data.map((pt, ptIdx) => {
              const isHoveredDot = isHoveredDataset && hoveredPoint?.pointIndex === ptIdx;

              const r = isHoveredDot ? dotRadius * 1.5 : dotRadius;
              // fill/stroke-opacity, NOT opacity — the entrance's forwards
              // fill holds opacity:1 (dead dim) AND an inline opacity:1 would
              // defeat the --animated class's pre-delay opacity:0 (stagger
              // flash). Both sub-properties together ≡ opacity for a dot.
              const dim = hasHover && !isHoveredDataset ? 0.3 : 1;

              const { animationDelay } = entranceProps(
                animate,
                names.dotAnimated.true,
                originalIndex * 80,
              );

              return (
                <circle
                  key={ptIdx}
                  cx={xScale(pt.x)}
                  cy={yScale(pt.y)}
                  r={r}
                  fill={color}
                  className={clsx(
                    styles.dot,
                    names.dot,
                    animate && [styles.dotAnimated, names.dotAnimated.true],
                  )}
                  style={
                    {
                      "--_openui-scatter-chart-dot-opacity": dim,
                      "--_openui-scatter-chart-dot-delay": animationDelay,
                    } as React.CSSProperties
                  }
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
};
