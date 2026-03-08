import clsx from "clsx";
import type { ScaleLinear } from "d3-scale";
import React from "react";

import { useScatterChartOrchestrator } from "../hooks";
import { DefaultLegend } from "../shared/DefaultLegend/DefaultLegend";
import { Grid } from "../shared/Grid";
import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import { ChartTooltip } from "../shared/PortalTooltip/ChartTooltip";
import { YAxis } from "../shared/YAxis";
import { NumericXAxis } from "./parts/NumericXAxis";
import { ScatterDots } from "./parts/ScatterDots";
import type { D3ScatterChartProps } from "./types";

const MIN_TICK_SPACING = 60;

interface VerticalGridProps {
  xScale: ScaleLinear<number, number>;
  chartWidth: number;
  chartHeight: number;
  className?: string;
}

const VerticalGrid: React.FC<VerticalGridProps> = ({
  xScale,
  chartWidth,
  chartHeight,
  className,
}) => {
  const tickCount = Math.max(2, Math.floor(chartWidth / MIN_TICK_SPACING));
  const ticks = xScale.ticks(tickCount);

  return (
    <g className={className}>
      {ticks.map((t) => (
        <line key={t} x1={xScale(t)} x2={xScale(t)} y1={0} y2={chartHeight} />
      ))}
    </g>
  );
};

export function D3ScatterChart(props: D3ScatterChartProps) {
  const {
    data,
    theme = "ocean",
    customPalette,
    grid: showGrid = true,
    verticalGrid: showVerticalGrid = true,
    legend: showLegend = true,
    showYAxis = true,
    xAxisLabel,
    yAxisLabel,
    isAnimationActive = true,
    dotRadius = 4,
    className,
    height,
    width,
    fitLegendInHeight,
    onClick,
  } = props;

  const orch = useScatterChartOrchestrator({
    data,
    chartThemeName: theme,
    customPalette,
    showLegend,
    showYAxis,
    height,
    width,
    fitLegendInHeight,
    onClick,
  });

  if (!data || data.length === 0) {
    return (
      <div className={clsx("openui-d3-scatter-chart-container openui-d3-chart-empty", className)}>
        <span className="openui-d3-chart-empty-text">No data available</span>
      </div>
    );
  }

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
    <LabelTooltipProvider>
      <div
        ref={orch.refs.containerRef}
        className={clsx("openui-d3-scatter-chart-container", className)}
        style={orch.style.containerStyle}
      >
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
                className="openui-d3-scatter-chart-y-axis"
                tickClassName="openui-d3-scatter-chart-y-tick"
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
                className="openui-d3-scatter-chart-grid"
              />
            )}

            {showVerticalGrid && (
              <VerticalGrid
                xScale={xScale}
                chartWidth={chartAreaWidth}
                chartHeight={chartInnerHeight}
                className="openui-d3-scatter-chart-grid-vertical"
              />
            )}

            <ScatterDots
              datasets={orch.data.visibleDatasets}
              allDatasets={data}
              xScale={xScale}
              yScale={yScale}
              colorMap={orch.data.colorMap}
              dotRadius={dotRadius}
              hoveredPoint={orch.hover.hoveredPoint}
              isAnimationActive={isAnimationActive}
              isPrinting={orch.isPrinting}
            />
          </g>

          <g transform={`translate(${effectiveYAxisWidth}, ${chartInnerHeight + marginTop})`}>
            <NumericXAxis
              scale={xScale}
              chartWidth={chartAreaWidth}
              height={xAxisHeight}
              className="openui-d3-scatter-chart-x-axis"
              tickClassName="openui-d3-scatter-chart-x-tick"
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
      </div>
    </LabelTooltipProvider>
  );
}
