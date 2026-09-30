import React, { useId, useMemo, useRef, useState } from "react";

import { buildContainerStyle } from "../../utils/buildContainerStyle";
import { useChartData } from "../core/useChartData";
import { useChartHover } from "../core/useChartHover";
import { useTooltipPayload } from "../core/useTooltipPayload";
import { useChartDimensions } from "./useChartDimensions";
import { useChartScroll } from "./useChartScroll";

import type { ChartColorPalette } from "../../../ThemeProvider";
import type { ChartData, XAxisTickVariant } from "../../types";
import type { ChartDensity } from "../../utils/scrollUtils";
import type { StackOffset } from "../../utils/yDomain";
import type { CartesianChartOrchestrator } from "./orchestratorTypes";

export interface UseCartesianChartOrchestratorParams<T extends ChartData> {
  /** "scroll" (default chart) or "fit" (the condensed, scroll-free variant). */
  layout: "scroll" | "fit";
  data: T;
  categoryKey: keyof T[number];
  themePaletteName: keyof ChartColorPalette;
  customPalette?: string[];
  showLegend: boolean;
  showYAxis: boolean;
  height?: number | string;
  fixedWidth?: number | string;
  fitLegendInHeight?: boolean;
  tickVariantProp: XAxisTickVariant;
  chartIdPrefix: string;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  onClick?: (row: T[number], index: number) => void;
  density?: ChartDensity;
  /** Series are stacked — y domain/axis width size to per-row sums. */
  stacked?: boolean;
  /** How stacked series combine (see `StackOffset`). */
  stackOffset?: StackOffset;
  /**
   * Y-tick-count hint. The chart also passes it to CartesianChartLayout for
   * YAxis/Grid rendering; here it makes the y-axis WIDTH measurement size the
   * same tick strings the axis will draw.
   */
  yTickCount?: number;
  /**
   * Share of a category's width its x-axis label is drawn in: bar charts draw
   * it under the bar's band, line and area charts across the whole category
   * (the default, 1). Lets the scrolling layout size categories for full labels.
   */
  labelShare?: number;
}

/**
 * Composes the data / geometry / hover / scroll / tooltip hooks behind one
 * cartesian contract. `layout` flows into `useChartDimensions` (which owns the
 * scroll-vs-fit value branching); the slices below are mode-agnostic. Every hook
 * is called unconditionally so the orchestrator obeys the Rules of Hooks across
 * a `layout` change.
 */
export function useCartesianChartOrchestrator<T extends ChartData>({
  layout,
  data,
  categoryKey,
  themePaletteName,
  customPalette,
  showLegend,
  showYAxis,
  height,
  fixedWidth,
  fitLegendInHeight,
  tickVariantProp,
  chartIdPrefix,
  icons,
  onClick,
  density,
  stacked,
  stackOffset,
  yTickCount,
  labelShare,
}: UseCartesianChartOrchestratorParams<T>): CartesianChartOrchestrator {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const chartId = `${chartIdPrefix}-${useId()}`;

  // Data: keys, colors, hidden series, config
  const chartData = useChartData({
    data,
    categoryKey,
    themePaletteName,
    customPalette,
    icons,
  });

  // Dimensions: sizing, layout, axis measurements (mode-aware)
  const dimensions = useChartDimensions({
    layout,
    containerRef,
    legendRef,
    data,
    catKey: chartData.catKey,
    dataKeys: chartData.dataKeys,
    showYAxis,
    showLegend,
    height,
    fixedWidth,
    fitLegendInHeight,
    tickVariantProp,
    density,
    stacked,
    stackOffset,
    yTickCount,
    labelShare,
  });

  // Hover: index, mouse position, handler factory
  const hover = useChartHover({ data, onClick });

  // Scroll: buttons, snap navigation (inert in fit — needsScroll is false there)
  const scroll = useChartScroll({
    mainContainerRef,
    data,
    needsScroll: dimensions.needsScroll,
    widthOfGroup: dimensions.widthOfGroup,
  });

  // Legend expand/collapse
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);

  // Tooltip
  const tooltipPayload = useTooltipPayload(
    hover.hoveredIndex,
    data,
    chartData.dataKeys,
    chartData.catKey,
    chartData.chartConfig,
  );

  // Container style
  const containerStyle = useMemo(
    () => buildContainerStyle(chartData.chartStyle, fixedWidth, height),
    [chartData.chartStyle, fixedWidth, height],
  );

  return {
    layout,
    refs: { containerRef, mainContainerRef, legendRef },
    identity: { chartId },
    data: {
      catKey: chartData.catKey,
      allDataKeys: chartData.allDataKeys,
      dataKeys: chartData.dataKeys,
      colors: chartData.colors,
      transformedKeys: chartData.transformedKeys,
      chartConfig: chartData.chartConfig,
      colorMap: chartData.colorMap,
    },
    dimensions: {
      containerWidth: dimensions.containerWidth,
      effectiveYAxisWidth: dimensions.effectiveYAxisWidth,
      chartAreaWidth: dimensions.chartAreaWidth,
      widthOfGroup: dimensions.widthOfGroup,
      chartInnerHeight: dimensions.chartInnerHeight,
      totalHeight: dimensions.totalHeight,
      totalSvgWidth: dimensions.totalSvgWidth,
      dataWidth: dimensions.dataWidth,
      needsScroll: dimensions.needsScroll,
      tickVariant: dimensions.tickVariant,
      labelInterval: dimensions.labelInterval,
      marginTop: dimensions.marginTop,
    },
    xAxis: dimensions.xAxis,
    scroll: {
      canScrollLeft: scroll.canScrollLeft,
      canScrollRight: scroll.canScrollRight,
      handleScroll: scroll.handleScroll,
      scrollTo: scroll.scrollTo,
    },
    hover: {
      hoveredIndex: hover.hoveredIndex,
      mousePos: hover.mousePos,
      createMouseHandlers: hover.createMouseHandlers,
    },
    legend: {
      legendItems: chartData.legendItems,
      hiddenSeries: chartData.hiddenSeries,
      isLegendExpanded,
      setIsLegendExpanded,
      toggleSeries: chartData.toggleSeries,
    },
    tooltip: { tooltipPayload },
    style: { containerStyle, chartStyle: chartData.chartStyle },
  };
}
