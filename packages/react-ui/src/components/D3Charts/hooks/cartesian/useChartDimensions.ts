import React, { useMemo } from "react";

import {
  CHART_MARGIN_TOP,
  DEFAULT_CHART_HEIGHT,
  SINGLE_LINE_BREAKPOINT,
} from "../../utils/constants";
import { resolveShouldFitLegend } from "../../utils/resolveShouldFitLegend";
import { getWidthOfData, getWidthOfGroup } from "../../utils/scrollUtils";
import { MAX_X_AXIS_HEIGHT_SHARE } from "../../utils/xAxisLabelLayout";
import type { StackOffset } from "../../utils/yDomain";
import { useContainerSize } from "../core/useContainerSize";
import { useLegendHeight } from "../core/useLegendHeight";
import { useXAxisLabelLayout } from "./useXAxisLabelLayout";
import { useYAxisWidth } from "./useYAxisWidth";

import type { ChartData, XAxisTickVariant } from "../../types";
import type { ChartDensity } from "../../utils/scrollUtils";

export interface UseChartDimensionsParams<T extends ChartData> {
  /**
   * "scroll" sizes the chart to its data (overflowing into a horizontal scroll
   * when wider than the container). "fit" packs all points into the available
   * width.
   */
  layout: "scroll" | "fit";
  containerRef: React.RefObject<HTMLDivElement | null>;
  legendRef: React.RefObject<HTMLDivElement | null>;
  data: T;
  catKey: string;
  dataKeys: string[];
  showYAxis: boolean;
  showLegend: boolean;
  height?: number | string;
  fixedWidth?: number | string;
  fitLegendInHeight?: boolean;
  tickVariantProp: XAxisTickVariant;
  density?: ChartDensity;
  /** Series are stacked — the y domain/axis-width use per-row sums. */
  stacked?: boolean;
  /** How stacked series combine (see `StackOffset`). */
  stackOffset?: StackOffset;
  /**
   * Y-tick-count hint (the chart's `yTickCount` prop). Threaded into the
   * y-axis width measurement so the measured tick strings are the RENDERED
   * ones when the consumer pins the count (YAxis/Grid receive the same hint).
   */
  yTickCount?: number;
}

/**
 * The single geometry source for the two cartesian modes. Every sub-hook is
 * called unconditionally (Rules of Hooks — `layout` is a prop that can change
 * between renders); only derived *values* branch on the mode. The two x-axis
 * sub-hooks both run every render and the live one is selected by `layout`.
 */
export function useChartDimensions<T extends ChartData>({
  layout,
  containerRef,
  legendRef,
  data,
  catKey,
  dataKeys,
  showYAxis,
  showLegend,
  height,
  fixedWidth,
  fitLegendInHeight,
  tickVariantProp,
  density,
  stacked = false,
  stackOffset,
  yTickCount,
}: UseChartDimensionsParams<T>) {
  const isFit = layout === "fit";

  const legendHeight = useLegendHeight(legendRef, showLegend);

  const { width: containerWidth, height: containerHeight } = useContainerSize(
    containerRef,
    fixedWidth,
    height,
  );

  const { yAxisWidth } = useYAxisWidth(data, dataKeys, stacked, {
    tickCount: yTickCount,
    scopeRef: containerRef,
    stackOffset,
  });
  const effectiveYAxisWidth = showYAxis ? yAxisWidth : 0;
  // Clamped: before the container is measured (SSR + first client render)
  // containerWidth is 0, and 0 − yAxisWidth would propagate a negative width
  // into the fit-mode hit rect / svg attributes (invalid SVG, console errors
  // on every fit-mode deep link).
  const availableWidth = Math.max(0, containerWidth - effectiveYAxisWidth);

  // Per-point group width: fit divides the available width across all points;
  // scroll uses a fixed density-derived width (which is what lets it overflow).
  const widthOfGroup = isFit
    ? data.length > 0
      ? availableWidth / data.length
      : 0
    : getWidthOfGroup(density);

  const dataWidth = useMemo(
    () => (isFit ? availableWidth : getWidthOfData(data, availableWidth, density)),
    [isFit, data, availableWidth, density],
  );
  const needsScroll = isFit ? false : dataWidth > availableWidth;

  // The drawable chart width. Scroll overflows to `dataWidth` when it needs to
  // scroll; otherwise (and always in fit, where needsScroll is false) it is the
  // available width. Collapses the old scroll `svgWidth` and fit `chartAreaWidth`.
  const chartAreaWidth = needsScroll ? dataWidth : availableWidth;

  const resolvedHeight =
    typeof height === "number"
      ? height
      : containerHeight > 0
        ? containerHeight
        : DEFAULT_CHART_HEIGHT;
  const shouldFitLegend = resolveShouldFitLegend(fitLegendInHeight, height);
  const svgAvailableHeight = shouldFitLegend ? resolvedHeight - legendHeight : resolvedHeight;

  // "angled" is fit-only; the scrolling axis also drops to one line in narrow containers.
  const tickVariant: XAxisTickVariant =
    isFit || (tickVariantProp !== "angled" && containerWidth >= SINGLE_LINE_BREAKPOINT)
      ? tickVariantProp
      : "singleLine";

  // The label band is capped at half the drawable height so the plot keeps
  // the rest; labels that don't fit are truncated rather than growing the band.
  const labelLayout = useXAxisLabelLayout(
    data,
    catKey,
    {
      variant: tickVariant,
      slotWidth: widthOfGroup,
      maxHeight: (svgAvailableHeight - CHART_MARGIN_TOP) * MAX_X_AXIS_HEIGHT_SHARE,
      condensed: isFit,
    },
    containerRef,
  );
  const labelInterval = labelLayout.interval;
  const xAxis = {
    angle: labelLayout.angle,
    xAxisHeight: labelLayout.height,
    labelWidth: labelLayout.labelWidth,
    maxLines: labelLayout.maxLines,
  };

  const chartInnerHeight = Math.max(0, svgAvailableHeight - CHART_MARGIN_TOP - xAxis.xAxisHeight);
  const totalHeight = svgAvailableHeight;
  const totalSvgWidth = effectiveYAxisWidth + chartAreaWidth;

  return {
    containerWidth,
    effectiveYAxisWidth,
    chartAreaWidth,
    widthOfGroup,
    chartInnerHeight,
    totalHeight,
    totalSvgWidth,
    dataWidth,
    needsScroll,
    tickVariant,
    labelInterval,
    marginTop: CHART_MARGIN_TOP,
    xAxis,
  };
}
