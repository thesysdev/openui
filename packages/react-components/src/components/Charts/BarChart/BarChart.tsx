"use client";

import clsx from "clsx";
import { useCallback } from "react";
import { names as baseNames, chartBaseStyles } from "../shared/chartBase.styles";
import { barChartStyles, names } from "./barChart.styles";
import { names as horizontalNames } from "./horizontalBarChart.styles";

import {
  BAND_PADDING_INNER,
  useCartesianChartOrchestrator,
  useEffectiveAnimation,
  useExportChartData,
  useStackedData,
  useXBandScale,
  useYScale,
} from "../hooks";
import { ClipDefs } from "../shared/cartesian/ClipDefs";
import { CartesianXAxis } from "../shared/cartesian/axes/CartesianXAxis";
import { CartesianChartLayout } from "../shared/cartesian/layouts/CartesianChartLayout";
import { findBandIndex } from "../utils/mouseUtils";
import { BarSeries } from "./parts/BarSeries";
import { Crosshair } from "./parts/Crosshair";
import { HorizontalBarChartImpl } from "./parts/HorizontalBarChartImpl";

import { CHART_CLASS_PREFIX } from "../utils/constants";
import type { BarChartData, BarChartProps } from "./types";

/**
 * Empty-data guard lives here, in a hook-free dispatcher: the chart impl below
 * calls hooks unconditionally, so the "no data" branch must short-circuit
 * *before* any hook runs (a count → 0 transition on a mounted chart would
 * otherwise break the Rules of Hooks).
 */
export function BarChart<T extends BarChartData>(props: BarChartProps<T>) {
  const styles = barChartStyles;
  const baseStyles = chartBaseStyles;
  if (!props.data || props.data.length === 0) {
    return (
      <div
        className={clsx(
          styles.root,
          props.orientation === "horizontal" ? horizontalNames.root : names.root,
          (props.orientation === "horizontal" ? horizontalNames : names).variant[
            props.variant ?? "grouped"
          ],
          baseStyles.empty,
          baseNames.empty,
          props.className,
        )}
      >
        <span className={clsx(baseStyles.emptyText, baseNames.emptyText)}>No data available</span>
      </div>
    );
  }
  if (props.orientation === "horizontal") {
    return <HorizontalBarChartImpl {...props} />;
  }
  return <BarChartImpl {...props} />;
}

function BarChartImpl<T extends BarChartData>({
  data,
  categoryKey,
  customPalette,
  variant = "grouped",
  tickVariant: tickVariantProp,
  barRadius = 4,
  maxBarWidth,
  internalLine = true,
  internalLineColor,
  internalLineWidth,
  grid = true,
  legend: showLegend = true,
  icons,
  isAnimationActive = false,
  showYAxis = true,
  xAxisLabel,
  yAxisLabel,
  className,
  height,
  width: fixedWidth,
  fitLegendInHeight,
  condensed = false,
  density,
  onClick,
  yTickCount,
}: BarChartProps<T>) {
  const styles = barChartStyles;
  const animate = useEffectiveAnimation(isAnimationActive);
  const mode = condensed ? "fit" : "scroll";

  const orch = useCartesianChartOrchestrator({
    layout: mode,
    data,
    categoryKey,
    themePaletteName: "barChartPalette",
    customPalette,
    showLegend,
    showYAxis,
    height,
    fixedWidth,
    fitLegendInHeight,
    tickVariantProp: tickVariantProp ?? (condensed ? "singleLine" : "multiLine"),
    chartIdPrefix: "d3bc",
    icons,
    onClick,
    density,
    stacked: variant === "stacked",
    yTickCount,
    // Labels are drawn under the bar's band, not across the whole category.
    labelShare: 1 - BAND_PADDING_INNER,
  });

  const isStacked = variant === "stacked";
  const xScale = useXBandScale(data, orch.data.catKey, orch.dimensions.chartAreaWidth);
  const stackedData = useStackedData(data, orch.data.dataKeys, isStacked);
  const yScale = useYScale(data, orch.data.dataKeys, orch.dimensions.chartInnerHeight, isStacked);

  const findIndex = useCallback((mouseX: number) => findBandIndex(xScale, mouseX), [xScale]);
  const mouseHandlers = orch.hover.createMouseHandlers(findIndex);

  // PPTX print-export JSON — mirrors react-ui's vertical BarChart call
  // (type:'bar', no extraOptions → barDir defaults to "col"). Undefined off
  // the print path.
  const exportData = useExportChartData({
    type: "bar",
    data,
    categoryKey: orch.data.catKey,
    dataKeys: orch.data.dataKeys,
    colors: orch.data.colors,
    legend: showLegend,
    xAxisLabel,
    yAxisLabel,
  });

  return (
    <CartesianChartLayout
      classes={{
        ...names,
        svg: clsx(styles.svg, names.svg),
        group: clsx(styles.group, names.group),
        containerInner: clsx(styles.containerInner, names.containerInner),
        yAxisContainer: clsx(styles.yAxisContainer, names.yAxisContainer),
        mainContainer: clsx(styles.mainContainer, names.mainContainer),
        yTick: clsx(styles.yTick, names.yTick),
        gridLine: clsx(styles.gridLine, names.gridLine),
      }}
      orch={orch}
      yScale={yScale}
      mouseHandlers={mouseHandlers}
      classPrefix="bar-chart"
      chartType="bar"
      exportData={exportData}
      ariaLabel="Bar chart"
      showYAxis={showYAxis}
      grid={grid}
      showLegend={showLegend}
      xAxisLabel={xAxisLabel}
      yAxisLabel={yAxisLabel}
      yTickCount={yTickCount}
      className={clsx(styles.root, names.root, names.variant[variant], className)}
      defs={
        <defs className={names.defs}>
          <ClipDefs
            className={names.clip}
            rectClassName={names.clipRect}
            chartId={orch.identity.chartId}
            chartWidth={orch.dimensions.chartAreaWidth}
            chartHeight={orch.dimensions.chartInnerHeight}
          />
        </defs>
      }
      series={
        <>
          <Crosshair
            hoveredIndex={orch.hover.hoveredIndex}
            xScale={xScale}
            data={data}
            categoryKey={orch.data.catKey}
            chartHeight={orch.dimensions.chartInnerHeight}
          />
          <BarSeries
            data={data}
            dataKeys={orch.data.dataKeys}
            xScale={xScale}
            yScale={yScale}
            variant={variant}
            stackedData={stackedData}
            categoryKey={orch.data.catKey}
            colors={orch.data.colorMap}
            barRadius={barRadius}
            maxBarWidth={maxBarWidth}
            internalLine={internalLine}
            internalLineColor={internalLineColor}
            internalLineWidth={internalLineWidth}
            isAnimationActive={animate}
          />
        </>
      }
      xAxis={
        <CartesianXAxis
          mode={mode}
          scale={xScale}
          classPrefix={`${CHART_CLASS_PREFIX}-bar-chart`}
          classes={names}
          tickClassName={clsx(styles.xTick, names.xTick)}
          angledTickClassName={clsx(styles.xTickAngled, names.xTickAngled)}
          tickVariant={orch.dimensions.tickVariant}
          labelHeight={orch.xAxis.xAxisHeight}
          labelWidth={orch.xAxis.labelWidth}
          maxLines={orch.xAxis.maxLines}
          labelInterval={orch.dimensions.labelInterval}
          angle={orch.xAxis.angle}
          chartWidth={orch.dimensions.chartAreaWidth}
          yAxisWidth={orch.dimensions.effectiveYAxisWidth}
        />
      }
    />
  );
}
