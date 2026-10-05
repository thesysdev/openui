import { useMemo } from "react";

import { useEffectiveAnimation, useScatterChartOrchestrator } from "../hooks";
import { NumericXAxis } from "../shared/cartesian/axes/NumericXAxis";
import { YAxis } from "../shared/cartesian/axes/YAxis";
import { Grid } from "../shared/cartesian/Grid";
import { VerticalGrid } from "../shared/cartesian/VerticalGrid";
import { ChartShell } from "../shared/core/ChartShell";
import { DefaultLegend } from "../shared/core/DefaultLegend/DefaultLegend";
import { ChartTooltip } from "../shared/core/PortalTooltip/ChartTooltip";
import { CHART_CLASS_PREFIX } from "../utils/constants";
import { ScatterDots } from "./parts/ScatterDots";
import type { ScatterChartProps } from "./types";

export function ScatterChart(props: ScatterChartProps) {
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
      containerRef={orch.refs.containerRef}
      classPrefix={`${CHART_CLASS_PREFIX}-scatter-chart`}
      className={className}
      style={orch.style.containerStyle}
      isEmpty={orch.isEmpty}
    >
      {() => (
        <>
          <svg
            width={totalSvgWidth}
            height={totalSvgHeight}
            style={{ overflow: "visible" }}
            role="img"
            aria-label="Scatter chart"
          >
            {showYAxis && (
              <g transform={`translate(0, ${marginTop})`}>
                <YAxis
                  scale={yScale}
                  width={effectiveYAxisWidth}
                  chartHeight={chartInnerHeight}
                  className={`${CHART_CLASS_PREFIX}-scatter-chart-y-axis`}
                  tickClassName={`${CHART_CLASS_PREFIX}-scatter-chart-y-tick`}
                />
              </g>
            )}

            <g
              transform={`translate(${effectiveYAxisWidth}, ${marginTop})`}
              onMouseMove={orch.hover.handleMouseMove}
              onMouseLeave={orch.hover.handleMouseLeave}
              onTouchMove={orch.hover.handleTouchMove}
              onTouchEnd={orch.hover.handleTouchEnd}
              onClick={orch.hover.handleClick}
            >
              <rect width={chartAreaWidth} height={chartInnerHeight} fill="transparent" />

              {showGrid && (
                <Grid
                  yScale={yScale}
                  chartWidth={chartAreaWidth}
                  chartHeight={chartInnerHeight}
                  className={`${CHART_CLASS_PREFIX}-scatter-chart-grid`}
                />
              )}

              {showVerticalGrid && (
                <VerticalGrid
                  xScale={xScale}
                  chartWidth={chartAreaWidth}
                  chartHeight={chartInnerHeight}
                  className={`${CHART_CLASS_PREFIX}-scatter-chart-grid-vertical`}
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

            <g transform={`translate(${effectiveYAxisWidth}, ${chartInnerHeight + marginTop})`}>
              <NumericXAxis
                scale={xScale}
                chartWidth={chartAreaWidth}
                height={xAxisHeight}
                className={`${CHART_CLASS_PREFIX}-scatter-chart-x-axis`}
                tickClassName={`${CHART_CLASS_PREFIX}-scatter-chart-x-tick`}
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
