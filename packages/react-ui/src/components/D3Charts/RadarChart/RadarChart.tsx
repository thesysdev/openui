import { useCallback, useMemo } from "react";

import { useEffectiveAnimation, useRadarChartOrchestrator } from "../hooks";
import { ChartShell } from "../shared/core/ChartShell";
import { DefaultLegend } from "../shared/core/DefaultLegend/DefaultLegend";
import { ChartTooltip } from "../shared/core/PortalTooltip/ChartTooltip";
import { CHART_CLASS_PREFIX } from "../utils/constants";
import { RadarAxisLabels } from "./parts/RadarAxisLabels";
import { RadarGrid } from "./parts/RadarGrid";
import { RadarSeries } from "./parts/RadarSeries";
import type { RadarChartData, RadarChartProps } from "./types";

export function RadarChart<T extends RadarChartData>(props: RadarChartProps<T>) {
  const {
    data,
    categoryKey,
    customPalette,
    gridShape = "polygon",
    gridLevels = 5,
    grid: showGrid = true,
    legend: showLegend = true,
    icons,
    isAnimationActive = false,
    variant = "line",
    areaOpacity = 0.2,
    showDots = false,
    dotRadius = 4,
    fillOpacity,
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
    themePaletteName: "radarChartPalette",
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

  const animate = useEffectiveAnimation(isAnimationActive);

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

  // Destructured so the memo depends on the callback identity itself (a
  // stable useCallback), not the whole orch.hover object.
  const { createMouseHandlers } = orch.hover;
  const mouseHandlers = useMemo(
    () => createMouseHandlers(findIndex),
    [createMouseHandlers, findIndex],
  );

  return (
    <ChartShell
      containerRef={orch.refs.containerRef}
      classPrefix={`${CHART_CLASS_PREFIX}-radar-chart`}
      className={className}
      style={orch.style.containerStyle}
      isEmpty={orch.isEmpty}
    >
      {() => (
        <>
          <div className={`${CHART_CLASS_PREFIX}-radar-chart-svg-wrapper`}>
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
                  fillOpacity={fillOpacity ?? (variant === "area" ? areaOpacity : 0)}
                  showDots={showDots}
                  dotRadius={dotRadius}
                  hoveredIndex={orch.hover.hoveredIndex}
                  animate={animate}
                />
                <RadarAxisLabels
                  data={data}
                  catKey={orch.data.catKey}
                  numAxes={numAxes}
                  maxRadius={orch.dimensions.maxRadius}
                  chartSize={orch.dimensions.chartSize}
                  containerWidth={orch.dimensions.containerWidth}
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
              onItemClick={orch.legend.toggleSeries}
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
        </>
      )}
    </ChartShell>
  );
}
