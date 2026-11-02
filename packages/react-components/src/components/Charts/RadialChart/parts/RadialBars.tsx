"use client";

import clsx from "clsx";
import { arc } from "d3-shape";
import type { CSSProperties } from "react";
import React, { useMemo } from "react";
import type { CategoricalSlice } from "../../hooks";
import { useIndexedClickHandler } from "../../hooks/core/useIndexedClickHandler";
import { entranceProps } from "../../utils/entranceUtils";
import { getSliceStyle, POLAR_HOVER_TRANSITION } from "../../utils/polarUtils";
import { names, radialChartStyles } from "../radialChart.styles";

interface RadialBarsProps<T> {
  slices: CategoricalSlice[];
  maxValue: number;
  maxRadius: number;
  minRadius: number;
  startAngle: number;
  endAngle: number;
  cornerRadius: number;
  barGap: number;
  hoveredIndex: number | null;
  /** Pre-folded "animation on AND not printing" — computed at the chart entry via useEffectiveAnimation. */
  animate: boolean;
  data: T[];
  onMouseMove: (event: React.MouseEvent, index: number) => void;
  onMouseLeave: () => void;
  onClick?: (row: T, index: number) => void;
}

export function RadialBars<T>({
  slices,
  maxValue,
  maxRadius,
  minRadius,
  startAngle,
  endAngle,
  cornerRadius,
  barGap,
  hoveredIndex,
  animate,
  data,
  onMouseMove,
  onMouseLeave,
  onClick,
}: RadialBarsProps<T>) {
  const styles = radialChartStyles;
  const handleClick = useIndexedClickHandler(data, onClick);

  const totalSweep = endAngle - startAngle;
  const barThickness = (maxRadius - minRadius) / slices.length;

  const bars = useMemo(
    () =>
      slices.map((slice, i) => {
        const barInner = minRadius + i * barThickness + barGap;
        const barOuter = minRadius + (i + 1) * barThickness;
        const sweepAngle = maxValue > 0 ? (slice.value / maxValue) * totalSweep : 0;

        const arcGen = arc<null>()
          .innerRadius(barInner)
          .outerRadius(barOuter)
          .startAngle(startAngle)
          .endAngle(startAngle + sweepAngle)
          .cornerRadius(cornerRadius);

        return {
          path: arcGen(null) as string,
          color: slice.color,
          label: slice.label,
        };
      }),
    [slices, maxValue, minRadius, startAngle, totalSweep, cornerRadius, barGap, barThickness],
  );

  return (
    <g className={names.group}>
      {bars.map((bar, i) => {
        const sliceStyle = getSliceStyle(i, hoveredIndex);
        const { className, animationDelay } = entranceProps(
          animate,
          clsx(styles.barIsAnimationActive, names.barIsAnimationActive),
          i * 60,
        );
        return (
          <path
            key={bar.label}
            d={bar.path}
            fill={bar.color}
            className={clsx(styles.bar, names.bar, className)}
            style={
              {
                "--_openui-radial-chart-bar-fill-opacity": sliceStyle.fillOpacity,
                "--_openui-radial-chart-bar-filter": sliceStyle.filter,
                "--_openui-radial-chart-bar-cursor": onClick ? "pointer" : undefined,
                "--_openui-radial-chart-bar-animation-delay": animationDelay,
                "--_openui-radial-chart-bar-transition": POLAR_HOVER_TRANSITION,
              } as CSSProperties
            }
            onMouseMove={(e) => onMouseMove(e, i)}
            onMouseLeave={onMouseLeave}
            onClick={() => handleClick(i)}
          />
        );
      })}
    </g>
  );
}
