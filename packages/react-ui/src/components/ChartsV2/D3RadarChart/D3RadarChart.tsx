import clsx from "clsx";
import { useCallback, useMemo } from "react";

import { useRadarChartOrchestrator } from "../hooks";
import { DefaultLegend } from "../shared/DefaultLegend/DefaultLegend";
import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import { ChartTooltip } from "../shared/PortalTooltip/ChartTooltip";
import { RadarAxisLabels } from "./parts/RadarAxisLabels";
import { RadarGrid } from "./parts/RadarGrid";
import { RadarSeries } from "./parts/RadarSeries";
import type { D3RadarChartData, D3RadarChartProps } from "./types";

export function D3RadarChart<T extends D3RadarChartData>(props: D3RadarChartProps<T>) {
  const {
    data,
    categoryKey,
    theme = "ocean",
    customPalette,
    gridShape = "polygon",
    gridLevels = 5,
    grid: showGrid = true,
    legend: showLegend = true,
    icons,
    isAnimationActive = true,
    showDots = true,
    dotRadius = 4,
    fillOpacity = 0.15,
    maxChartSize = 500,
    minChartSize = 150,
    height,
    width,
    fitLegendInHeight,
    className,
    onClick,
  } = props;

  const orch = useRadarChartOrchestrator({
    data,
    categoryKey,
    chartThemeName: theme,
    customPalette,
    icons,
    showLegend,
    maxChartSize,
    minChartSize,
    height,
    width,
    fitLegendInHeight,
    onClick,
  });

  const numAxes = data.length;

  const findIndex = useCallback(
    (mouseX: number, mouseY: number) => {
      if (numAxes === 0) return -1;
      let angle = Math.atan2(mouseY, mouseX) + Math.PI / 2;
      if (angle < 0) angle += 2 * Math.PI;
      return Math.round(angle / ((2 * Math.PI) / numAxes)) % numAxes;
    },
    [numAxes],
  );

  const mouseHandlers = useMemo(
    () => orch.hover.createMouseHandlers(findIndex),
    [orch.hover.createMouseHandlers, findIndex],
  );

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className={clsx("openui-d3-radar-chart-container openui-d3-chart-empty", className)}>
        <span className="openui-d3-chart-empty-text">No data available</span>
      </div>
    );
  }

  return (
    <LabelTooltipProvider>
      <div
        ref={orch.refs.containerRef}
        className={clsx("openui-d3-radar-chart-container", className)}
        style={orch.style.containerStyle}
      >
        <div className="openui-d3-radar-chart-svg-wrapper">
          <svg
            width={orch.dimensions.svgWidth}
            height={orch.dimensions.svgHeight}
            viewBox={`0 0 ${orch.dimensions.svgWidth} ${orch.dimensions.svgHeight}`}
            role="img"
            aria-label="Radar chart"
          >
            <g
              transform={`translate(${orch.dimensions.centerX}, ${orch.dimensions.centerY})`}
              onMouseMove={mouseHandlers.handleMouseMove}
              onMouseLeave={mouseHandlers.handleMouseLeave}
              onTouchMove={mouseHandlers.handleTouchMove}
              onTouchEnd={mouseHandlers.handleTouchEnd}
              onClick={mouseHandlers.handleClick}
            >
              {showGrid && (
                <RadarGrid
                  maxRadius={orch.dimensions.maxRadius}
                  gridLevels={gridLevels}
                  gridShape={gridShape}
                  numAxes={numAxes}
                />
              )}
              <RadarSeries
                data={data}
                dataKeys={orch.data.dataKeys}
                catKey={orch.data.catKey}
                radialScale={orch.dimensions.radialScale}
                numAxes={numAxes}
                colorMap={orch.data.colorMap}
                fillOpacity={fillOpacity}
                showDots={showDots}
                dotRadius={dotRadius}
                hoveredIndex={orch.hover.hoveredIndex}
                isAnimationActive={isAnimationActive}
                isPrinting={orch.isPrinting}
              />
              <RadarAxisLabels
                data={data}
                catKey={orch.data.catKey}
                numAxes={numAxes}
                maxRadius={orch.dimensions.maxRadius}
              />
            </g>
          </svg>
        </div>

        {showLegend && (
          <DefaultLegend
            ref={orch.refs.legendRef}
            items={orch.legend.legendItems}
            containerWidth={orch.dimensions.containerWidth}
            isExpanded={orch.legend.isLegendExpanded}
            setIsExpanded={orch.legend.setIsLegendExpanded}
            onItemClick={orch.legend.handleLegendItemClick}
            hiddenSeries={orch.legend.hiddenSeries}
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
