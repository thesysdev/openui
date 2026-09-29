import type { CSSProperties } from "react";
import { useRef } from "react";

import { useHorizontalBarChartOrchestrator } from "../../hooks/cartesian/useHorizontalBarChartOrchestrator";
import { useExportChartData } from "../../hooks/core/useExportChartData";
import { NumericXAxis } from "../../shared/cartesian/axes/NumericXAxis";
import { ScrollButtonsVertical } from "../../shared/cartesian/ScrollButtonsVertical/ScrollButtonsVertical";
import { VerticalGrid } from "../../shared/cartesian/VerticalGrid";
import { ChartShell } from "../../shared/core/ChartShell";
import { DefaultLegend } from "../../shared/core/DefaultLegend/DefaultLegend";
import { ChartTooltip } from "../../shared/core/PortalTooltip/ChartTooltip";
import { CHART_CLASS_PREFIX } from "../../utils/constants";
import type { BarChartData, BarChartProps } from "../types";
import { X_AXIS_HEIGHT } from "./horizontalBarGeometry";
import { HorizontalBarSeries } from "./HorizontalBarSeries";
import { HorizontalCrosshair } from "./HorizontalCrosshair";

const CLASS_PREFIX = `${CHART_CLASS_PREFIX}-horizontal-bar-chart`;

/**
 * The HORIZONTAL BarChart shell — the integration layer that assembles the
 * private orchestrator, the row renderer, the shared value axis/grid, the
 * vertical snap-scroll, the tooltip, and the legend into a working chart.
 * Renders through `ChartShell` (container + `LabelTooltipProvider`) WITHOUT
 * `CartesianChartLayout`, mirroring the `ScatterChart`/`FunnelChart` precedent,
 * so it touches none of the shared vertical Line/Area machinery.
 *
 * DOM (a faithful port of openui's `horizontalBarChart.scss` structure,
 * re-prefixed `${CHART_CLASS_PREFIX}-horizontal-bar-chart*`):
 *
 *   ChartShell -container (flex column, its own persistent ref)
 *     -container-inner-wrapper (flex row, overflow hidden, height = chartHeight)
 *       -container-inner (flex column, flex:1, min-width:0)   ← containerRef
 *         -main-container (overflow-y:auto, scrollbar hidden)  ← scrollBodyRef
 *           <svg> VerticalGrid + HorizontalBarSeries </svg>    (height = svgHeight)
 *         -x-axis-container (fixed, border-top)
 *           <svg> NumericXAxis </svg>                          (same valueScale)
 *       ScrollButtonsVertical (25px column, gated on overflow)
 *     DefaultLegend (below)
 *     ChartTooltip (on hover)
 *
 * SCROLL-GUTTER CONTRACT: the orchestrator's `chartWidth = measured containerRef
 * width` with NO subtraction for the 25px scroll-buttons column. So the measured
 * `containerRef` is attached to `-container-inner` (flex:1) — which sits to the
 * LEFT of `ScrollButtonsVertical` and whose measured width therefore already
 * excludes the gutter. Attaching it to the OUTER container would let the bars
 * overshoot ~25px under the buttons on overflow. `ChartShell` gets its OWN
 * persistent ref (`shellContainerRef`) instead, so the measured node is the
 * nested inner body.
 *
 * EMPTY: the hook-free dispatcher (`BarChart`, Task 7) short-circuits empty data
 * BEFORE this impl mounts (as the vertical `BarChart` already does), so `inner`
 * always mounts WITH data present and the `ResizeObserver` on it never observes
 * an unmounted node. The `isEmpty` guard passed to `ChartShell` is the
 * defensive belt-and-suspenders for a direct empty render.
 */
export function HorizontalBarChartImpl<T extends BarChartData>(props: BarChartProps<T>) {
  const {
    data,
    categoryKey,
    grid = true,
    legend: showLegend = true,
    isAnimationActive = false,
    className,
    xAxisLabel,
    yAxisLabel,
  } = props;

  // Measured (width feeds `chartWidth`); attached to `-container-inner`.
  const containerRef = useRef<HTMLDivElement>(null);
  // The `overflow-y:auto` scroll body; read for the snap-scroll boundaries.
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  // ChartShell's persistent `-container` div — a separate ref so the measured
  // node stays the nested inner body (see SCROLL-GUTTER CONTRACT above).
  const shellContainerRef = useRef<HTMLDivElement>(null);

  const orch = useHorizontalBarChartOrchestrator(props, containerRef, scrollBodyRef);

  const {
    isEmpty,
    isPrinting,
    legendRef,
    containerStyle,
    legendItems,
    labelHeight,
    valueScale,
    chartWidth,
    chartHeight,
    svgHeight,
    rows,
    rowOffsets,
    groupHeight,
    hover,
    tooltip,
    legend: legendControls,
    scroll,
    dataKeys,
    colors,
  } = orch;

  // PPTX print-export JSON — mirrors react-ui's HorizontalBarChart call
  // (type:'bar' + extraOptions.barDir:'bar' for the horizontal orientation).
  // `colors` runs parallel to the visible `dataKeys`. Undefined off the print
  // path; passed to ChartShell's root `data-openui-chart`.
  const exportData = useExportChartData({
    type: "bar",
    data,
    categoryKey: String(categoryKey),
    dataKeys,
    colors,
    legend: showLegend,
    xAxisLabel,
    yAxisLabel,
    extraOptions: {
      barDir: "bar",
    },
  });

  return (
    <ChartShell
      containerRef={shellContainerRef}
      classPrefix={CLASS_PREFIX}
      className={className}
      style={containerStyle as CSSProperties}
      isEmpty={isEmpty}
      exportData={exportData}
    >
      {() => (
        <>
          <div
            className={`${CLASS_PREFIX}-container-inner-wrapper`}
            style={{ height: chartHeight }}
          >
            <div ref={containerRef} className={`${CLASS_PREFIX}-container-inner`}>
              <div
                ref={scrollBodyRef}
                className={`${CLASS_PREFIX}-main-container`}
                onScroll={scroll.onScroll}
              >
                <svg
                  width="100%"
                  height={svgHeight}
                  role="img"
                  aria-label="Horizontal bar chart"
                  onMouseMove={hover.onMouseMove}
                  onMouseLeave={hover.onMouseLeave}
                >
                  {grid && (
                    <VerticalGrid
                      xScale={valueScale}
                      chartWidth={chartWidth}
                      chartHeight={svgHeight}
                      className={`${CLASS_PREFIX}-grid-vertical`}
                    />
                  )}

                  {/* Hovered-row highlight band — mounted BEHIND the rows so
                      the bars/labels paint over it. Springs on Y between rows
                      (the transpose of the vertical BarChart's column
                      crosshair). */}
                  <HorizontalCrosshair
                    hoveredIndex={hover.hoveredIndex}
                    rowOffsets={rowOffsets}
                    groupHeight={groupHeight}
                    chartWidth={chartWidth}
                  />

                  <HorizontalBarSeries
                    rows={rows}
                    labelHeight={labelHeight}
                    chartWidth={chartWidth}
                    hoveredCategory={hover.hoveredCategory}
                    isAnimationActive={isAnimationActive}
                    isPrinting={isPrinting}
                    classPrefix={CLASS_PREFIX}
                  />
                </svg>
              </div>

              <div className={`${CLASS_PREFIX}-x-axis-container`}>
                <svg width="100%" height={X_AXIS_HEIGHT}>
                  <NumericXAxis
                    scale={valueScale}
                    chartWidth={chartWidth}
                    height={X_AXIS_HEIGHT}
                    className={`${CLASS_PREFIX}-x-axis`}
                    tickClassName={`${CLASS_PREFIX}-x-tick`}
                    edgeAlign
                  />
                </svg>
              </div>
            </div>

            {scroll.needsScroll && (
              <ScrollButtonsVertical
                canScrollUp={scroll.canUp}
                canScrollDown={scroll.canDown}
                onScrollUp={scroll.onScrollUp}
                onScrollDown={scroll.onScrollDown}
              />
            )}
          </div>

          {showLegend && (
            <DefaultLegend
              ref={legendRef}
              items={legendItems}
              containerWidth={chartWidth}
              isExpanded={legendControls.isLegendExpanded}
              setIsExpanded={legendControls.setIsLegendExpanded}
              onItemClick={legendControls.toggleSeries}
              hiddenSeries={legendControls.hiddenSeries}
              xAxisLabel={xAxisLabel}
              yAxisLabel={yAxisLabel}
            />
          )}

          {tooltip.payload && tooltip.position && (
            <ChartTooltip
              label={tooltip.payload.label}
              items={tooltip.payload.items}
              viewportPosition={tooltip.position}
            />
          )}
        </>
      )}
    </ChartShell>
  );
}
