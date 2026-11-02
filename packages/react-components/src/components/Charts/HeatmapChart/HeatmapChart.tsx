"use client";

import clsx from "clsx";
import type { CSSProperties } from "react";
import { useEffectiveAnimation } from "../hooks";
import { useHeatmapChartOrchestrator } from "../hooks/cartesian/useHeatmapChartOrchestrator";
import { XAxis } from "../shared/cartesian/axes/XAxis";
import { ChartShell } from "../shared/core/ChartShell";
import { DefaultLegend } from "../shared/core/DefaultLegend/DefaultLegend";
import { ChartTooltip } from "../shared/core/PortalTooltip/ChartTooltip";
import { CHART_CLASS_PREFIX } from "../utils/constants";
import { heatmapChartStyles, names } from "./heatmapChart.styles";
import { HeatmapCells } from "./parts/HeatmapCells";
import { HeatmapColorScale } from "./parts/HeatmapColorScale";
import { HeatmapYAxis } from "./parts/HeatmapYAxis";
import type { HeatmapChartData, HeatmapChartProps } from "./types";

const CLASS_PREFIX = `${CHART_CLASS_PREFIX}-heatmap-chart`;

export function HeatmapChart<T extends HeatmapChartData>(props: HeatmapChartProps<T>) {
  const styles = heatmapChartStyles;
  const {
    data,
    categoryKey,
    customPalette,
    rampMode = "sequential",
    legend: showLegend = true,
    showColorScale = true,
    showCellLabels = false,
    showYAxis = true,
    isAnimationActive = false,
    cellGap = 2,
    cellRadius = 2,
    height,
    width,
    fitLegendInHeight,
    className,
    onClick,
  } = props;

  const orch = useHeatmapChartOrchestrator({
    data,
    categoryKey,
    // No heatmap token exists on react-ui's ChartColorPalette yet (same
    // situation as scatter) — the catch-all palette is the per-type token.
    themePaletteName: "defaultChartPalette",
    customPalette,
    rampMode,
    showLegend,
    showColorScale,
    showYAxis,
    height,
    width,
    fitLegendInHeight,
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
    scales: { xScale, yScale, colorScale },
  } = orch;

  return (
    <ChartShell
      containerRef={orch.refs.containerRef}
      className={clsx(
        styles.root,
        names.root,
        names.rampMode[rampMode],
        isAnimationActive && names.isAnimationActive.true,
        className,
      )}
      style={
        {
          "--_openui-heatmap-chart-root-width": orch.style.containerStyle["width"],
          "--_openui-heatmap-chart-root-height": orch.style.containerStyle["height"],
        } as CSSProperties
      }
      isEmpty={orch.isEmpty}
    >
      {() => (
        <>
          <svg
            className={clsx(styles.svg, names.svg)}
            width={totalSvgWidth}
            height={totalSvgHeight}
            style={{ "--_openui-heatmap-chart-svg-overflow": "visible" } as CSSProperties}
            role="img"
            aria-label="Heatmap chart"
          >
            {showYAxis && (
              <g className={names.group} transform={`translate(0, ${marginTop})`}>
                <HeatmapYAxis scale={yScale} width={effectiveYAxisWidth} />
              </g>
            )}

            <g
              className={names.group}
              transform={`translate(${effectiveYAxisWidth}, ${marginTop})`}
              onMouseLeave={orch.hover.handleMouseLeave}
            >
              <rect
                className={names.hitbox}
                width={chartAreaWidth}
                height={chartInnerHeight}
                fill="transparent"
              />

              <HeatmapCells
                data={data}
                catKey={orch.data.catKey}
                columnKeys={orch.data.columnKeys}
                visibleRowKeys={orch.data.visibleRowKeys}
                xScale={xScale}
                yScale={yScale}
                colorScale={colorScale}
                cellGap={cellGap}
                cellRadius={cellRadius}
                showCellLabels={showCellLabels}
                animate={animate}
                onCellMouseMove={orch.hover.handleCellMouseMove}
                onCellMouseLeave={orch.hover.handleMouseLeave}
                onClick={onClick}
              />
            </g>

            <g
              className={names.group}
              transform={`translate(${effectiveYAxisWidth}, ${chartInnerHeight + marginTop})`}
            >
              <XAxis
                partClassNames={{
                  root: names.xAxis,
                  tick: clsx(styles.xTick, names.xTick),
                  textLine: names.textLine,
                  group: names.group,
                  hitbox: names.hitbox,
                }}
                classPrefix={CLASS_PREFIX}
                scale={xScale}
                tickVariant="singleLine"
                labelHeight={xAxisHeight}
                labelInterval={orch.dimensions.labelInterval}
              />
            </g>
          </svg>

          {showColorScale && (
            <HeatmapColorScale
              ref={orch.refs.colorScaleRef}
              buckets={orch.colorScaleLegend.buckets}
              domainMin={orch.colorScaleLegend.domainMin}
              domainMax={orch.colorScaleLegend.domainMax}
              diverging={rampMode === "diverging"}
            />
          )}

          {showLegend && (
            <DefaultLegend
              ref={orch.refs.legendRef}
              items={orch.legend.legendItems}
              containerWidth={orch.dimensions.containerWidth}
              isExpanded={orch.legend.isLegendExpanded}
              setIsExpanded={orch.legend.setIsLegendExpanded}
              onItemClick={orch.data.toggleRow}
              hiddenSeries={orch.data.hiddenRows}
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
