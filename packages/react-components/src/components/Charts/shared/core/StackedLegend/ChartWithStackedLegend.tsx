"use client";

import clsx from "clsx";
import { type ReactNode, useId, useRef } from "react";
import { useContainerSize } from "../../../hooks/core/useContainerSize";
import { LegendStoreProvider } from "../legend/LegendStoreProvider";
import { StackedLegend } from "./StackedLegend";
import { names, stackedLegendStyles } from "./stackedLegend.styles";

/** Width from which the chart and its stacked legend sit side by side. */
export const STACKED_LEGEND_ROW_BREAKPOINT = 400;

const toCssSize = (value: number | string | undefined) =>
  typeof value === "number" ? `${value}px` : value;

/**
 * A polar chart with its built-in stacked legend — the `legendVariant="stacked"`
 * layout of the Pie and Radial charts: chart and legend side by side (half the
 * width each) from 400px up, the legend under the chart when narrower. Chart
 * and legend share a local legend store, so hovering or toggling a legend row
 * drives the chart and the reverse. `width`, `height` and `className` size and
 * style the whole layout.
 */
export function ChartWithStackedLegend({
  children,
  width,
  height,
  className,
}: {
  children: ReactNode;
  width?: number | string;
  height?: number | string;
  className?: string;
}) {
  const styles = stackedLegendStyles;
  const legendKey = useId();
  const ref = useRef<HTMLDivElement>(null);
  const { width: layoutWidth } = useContainerSize(ref, width);
  const isRow = layoutWidth >= STACKED_LEGEND_ROW_BREAKPOINT;

  return (
    <LegendStoreProvider legendKey={legendKey}>
      <div
        ref={ref}
        className={clsx(styles.layout, names.layout, className)}
        data-orientation={isRow ? "horizontal" : "vertical"}
        style={{ width: toCssSize(width), height: toCssSize(height) }}
      >
        <div className={clsx(styles.chart, names.chart)}>{children}</div>
        <div className={clsx(styles.legend, names.legend)}>
          {/* Side by side the list scrolls; stacked, the width drives show-more.
              Rows show each item's share. */}
          <StackedLegend format="percentage" containerWidth={isRow ? undefined : layoutWidth} />
        </div>
      </div>
    </LegendStoreProvider>
  );
}
