"use client";

import clsx from "clsx";
import { useMemo } from "react";
import { names, scatterChartStyles } from "./scatterChart.styles";

import { useEffectiveAnimation, useScatterChartOrchestrator } from "../hooks";
import { NumericXAxis } from "../shared/cartesian/axes/NumericXAxis";
import { YAxis } from "../shared/cartesian/axes/YAxis";
import { Grid } from "../shared/cartesian/Grid";
import { VerticalGrid } from "../shared/cartesian/VerticalGrid";
import { ChartShell } from "../shared/core/ChartShell";
import { DefaultLegend } from "../shared/core/DefaultLegend/DefaultLegend";
import { ChartTooltip } from "../shared/core/PortalTooltip/ChartTooltip";
import { ScatterDots } from "./parts/ScatterDots";
import type { ScatterChartProps } from "./types";

export function ScatterChart(props: ScatterChartProps) {
  const styles = scatterChartStyles;
  const {
    data,
    xAxisDataKey = "x",
    yAxisDataKey = "y",
    customPalette,
    grid: showGrid = true,
    verticalGrid: showVerticalGrid = true,
    legend: showLegend = true,
    showYAxis = true,
    xAxisLabel,
    yAxisLabel,
    isAnimationActive = false,
    dotRadius = 4,
    className,
    height,
    width,
    fitLegendInHeight,
    onClick,
  } = props;

  // Points are placed by their `x` / `y`; other data keys are read into them.
  const points = useMemo(
    () =>
      !Array.isArray(data) || (xAxisDataKey === "x" && yAxisDataKey === "y")
        ? data
        : data.map((dataset) => ({
            ...dataset,
            data: dataset.data.map((point) => ({
              ...point,
              x: Number(point[xAxisDataKey]),
              y: Number(point[yAxisDataKey]),
            })),
          })),
    [data, xAxisDataKey, yAxisDataKey],
  );

  const orch = useScatterChartOrchestrator({
    data: points,
    themePaletteName: "defaultChartPalette",
    customPalette,
    showLegend,
    showYAxis,
    height,
    width,
    fitLegendInHeight,
    xAxisLabel: typeof xAxisLabel === "string" ? xAxisLabel : undefined,
    yAxisLabel: typeof yAxisLabel === "string" ? yAxisLabel : undefined,
    onClick,
  });

  const animate = useEffectiveAnimation(isAnimationActive);

  const {
    dimensions: {
      effectiveYAxisWidth,
      chartAreaWidth,
      chartInnerHeight,
      totalSvgWidth,
      totalSvgHeight,
      xAxisHeight,
      CHART_MARGIN_TOP: marginTop,
    },
    scales: { xScale, yScale },
  } = orch;

  return (
    <ChartShell
      flat
      containerRef={orch.refs.containerRef}
      classPrefix={names.root}
      className={clsx(styles.root, names.root, className)}
      style={orch.style.containerStyle}
      isEmpty={orch.isEmpty}
    >
      {() => (
        <>
          <svg
            className={clsx(styles.svg, names.svg)}
            width={totalSvgWidth}
            height={totalSvgHeight}
            role="img"
            aria-label="Scatter chart"
          >
            {showYAxis && (
              <g className={names.group} transform={`translate(0, ${marginTop})`}>
                <YAxis
                  scale={yScale}
                  width={effectiveYAxisWidth}
                  chartHeight={chartInnerHeight}
                  className={names.yAxis}
                  tickClassName={clsx(styles.yTick, names.yTick)}
                />
              </g>
            )}

            <g
              className={names.group}
              transform={`translate(${effectiveYAxisWidth}, ${marginTop})`}
              onMouseMove={orch.hover.handleMouseMove}
              onMouseLeave={orch.hover.handleMouseLeave}
              onTouchMove={orch.hover.handleTouchMove}
              onTouchEnd={orch.hover.handleTouchEnd}
              onClick={orch.hover.handleClick}
            >
              <rect
                className={names.hitTarget}
                width={chartAreaWidth}
                height={chartInnerHeight}
                fill="transparent"
              />

              {showGrid && (
                <Grid
                  lineClassName={clsx(styles.gridLine, names.gridLine)}
                  yScale={yScale}
                  chartWidth={chartAreaWidth}
                  chartHeight={chartInnerHeight}
                  className={names.grid}
                />
              )}

              {showVerticalGrid && (
                <VerticalGrid
                  lineClassName={clsx(styles.gridLine, names.gridLine)}
                  xScale={xScale}
                  chartWidth={chartAreaWidth}
                  chartHeight={chartInnerHeight}
                  className={names.gridVertical}
                />
              )}

              <ScatterDots
                datasets={orch.data.visibleDatasets}
                xScale={xScale}
                yScale={yScale}
                colorMap={orch.data.colorMap}
                dotRadius={dotRadius}
                hoveredPoint={orch.hover.hoveredPoint}
                animate={animate}
              />
            </g>

            <g
              className={names.group}
              transform={`translate(${effectiveYAxisWidth}, ${chartInnerHeight + marginTop})`}
            >
              <NumericXAxis
                scale={xScale}
                chartWidth={chartAreaWidth}
                height={xAxisHeight}
                className={names.xAxis}
                tickClassName={clsx(styles.xTick, names.xTick)}
              />
            </g>
          </svg>

          {showLegend && (
            <DefaultLegend
              ref={orch.refs.legendRef}
              items={orch.legend.legendItems}
              containerWidth={orch.dimensions.containerWidth}
              isExpanded={orch.legend.isLegendExpanded}
              setIsExpanded={orch.legend.setIsLegendExpanded}
              onItemClick={orch.legend.toggleSeries}
              hiddenSeries={orch.legend.hiddenSeries}
              xAxisLabel={xAxisLabel}
              yAxisLabel={yAxisLabel}
            />
          )}

          {orch.tooltip.tooltipPayload && orch.hover.mousePos && (
            <ChartTooltip
              label={orch.tooltip.tooltipPayload.label}
              items={orch.tooltip.tooltipPayload.items}
              viewportPosition={orch.hover.mousePos}
            />
          )}
        </>
      )}
    </ChartShell>
  );
}
