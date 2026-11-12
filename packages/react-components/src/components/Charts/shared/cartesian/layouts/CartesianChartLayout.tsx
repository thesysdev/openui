"use client";

import clsx from "clsx";
import type { ScaleLinear } from "d3-scale";
import React from "react";
import { chartBaseStyles, names } from "../../chartBase.styles";

import type { CartesianChartOrchestrator } from "../../../hooks";
import { MeasureFontScopeContext } from "../../../hooks/core/measureFontScope";
import { CHART_CLASS_PREFIX } from "../../../utils/constants";
import { DefaultLegend } from "../../core/DefaultLegend/DefaultLegend";
import { LabelTooltipProvider } from "../../core/LabelTooltip/LabelTooltip";
import { ChartTooltip } from "../../core/PortalTooltip/ChartTooltip";
import { Grid } from "../Grid";
import { ScrollButtonsHorizontal } from "../ScrollButtonsHorizontal/ScrollButtonsHorizontal";
import { YAxis } from "../axes/YAxis";

// Handlers are produced by `orch.hover.createMouseHandlers`, which types them on
// the SVGElement base. The scroll body attaches them to its `<svg>` and the fit
// body to an inner `<g>`; an SVGElement handler is assignable to both (param
// contravariance), so one element-agnostic type serves both modes.
interface MouseHandlers {
  handleMouseMove: React.MouseEventHandler<SVGElement>;
  handleMouseLeave: React.MouseEventHandler<SVGElement>;
  handleTouchMove: React.TouchEventHandler<SVGElement>;
  handleTouchEnd: React.TouchEventHandler<SVGElement>;
  handleClick?: React.MouseEventHandler<SVGElement>;
}

export interface CartesianChartLayoutProps {
  classes?: Partial<
    Record<
      | "containerInner"
      | "yAxisContainer"
      | "mainContainer"
      | "yTick"
      | "gridLine"
      | "svg"
      | "group"
      | "hitTarget"
      | "grid"
      | "yAxis",
      string
    >
  >;
  orch: CartesianChartOrchestrator;
  yScale: ScaleLinear<number, number>;
  mouseHandlers: MouseHandlers;
  defs?: React.ReactNode;
  series: React.ReactNode;
  xAxis: React.ReactNode;
  classPrefix: string;
  chartType: string;
  ariaLabel: string;
  showYAxis: boolean;
  grid: boolean;
  showLegend: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  /**
   * Y-tick-count hint. Threaded UNCHANGED to both the `YAxis` (labels) and the
   * `Grid` (horizontal lines) so they resolve the identical tick count and stay
   * aligned. Undefined → each falls back to the height-derived default.
   */
  yTickCount?: number;
  className?: string;
  /**
   * The PPTX print-export JSON (from `useExportChartData`). Present only on the
   * print path; when set it takes precedence over `chartType` on the root's
   * `data-openui-chart` attribute, so the exporter reads full chart JSON instead
   * of the bare type string. Undefined off the print path — the attribute then
   * keeps its existing `chartType` value (no behavior change).
   */
  exportData?: string;
}

/**
 * The two cartesian layouts unified. `orch.layout` is the discriminant:
 * "scroll" keeps the y-axis in a fixed `<svg>` beside a horizontally-scrolling
 * main `<svg>` (with scroll buttons); "fit" packs everything into one `<svg>`
 * with translated `<g>`s (no scroll). The shared chrome — container, legend,
 * tooltip — is identical and lives here; the divergent SVG trees are
 * `ScrollBody`/`FitBody`.
 */
export function CartesianChartLayout(props: CartesianChartLayoutProps) {
  const styles = chartBaseStyles;
  const { orch } = props;
  const prefix = `${CHART_CLASS_PREFIX}-${props.classPrefix}`;

  // Fit (condensed) mode mirrors react-ui's *Condensed charts: the axis labels
  // render as standalone text divs — yAxisLabel top-left above the chart,
  // xAxisLabel bottom-centered below it — and are kept OUT of the legend strip.
  // Scroll mode keeps them in the legend strip (react-ui's non-condensed look).
  const isFit = orch.layout === "fit";

  return (
    <LabelTooltipProvider>
      {/* Measurement-font scope: XAxis/legend children resolve the tick font
          from this container's computed style (the render channel) instead of
          the JS theme context — see measureFontScope.ts. */}
      <MeasureFontScopeContext.Provider value={orch.refs.containerRef}>
        <div
          ref={orch.refs.containerRef}
          className={props.className}
          style={orch.style.containerStyle as React.CSSProperties}
          // PPTX-exporter contract attribute — not derived from the class prefix.
          data-openui-chart={props.exportData ?? props.chartType}
        >
          {isFit && props.yAxisLabel && (
            <div className={clsx(styles.yAxisLabel, names.yAxisLabel)}>{props.yAxisLabel}</div>
          )}

          {orch.layout === "scroll" ? (
            <ScrollBody {...props} prefix={prefix} />
          ) : (
            <FitBody {...props} prefix={prefix} />
          )}

          {isFit && props.xAxisLabel && (
            <div className={clsx(styles.xAxisLabel, names.xAxisLabel)}>{props.xAxisLabel}</div>
          )}

          {props.showLegend && (
            <DefaultLegend
              ref={orch.refs.legendRef}
              items={orch.legend.legendItems}
              hiddenSeries={orch.legend.hiddenSeries}
              onItemClick={orch.legend.toggleSeries}
              isExpanded={orch.legend.isLegendExpanded}
              setIsExpanded={orch.legend.setIsLegendExpanded}
              containerWidth={orch.dimensions.containerWidth}
              xAxisLabel={isFit ? undefined : props.xAxisLabel}
              yAxisLabel={isFit ? undefined : props.yAxisLabel}
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
      </MeasureFontScopeContext.Provider>
    </LabelTooltipProvider>
  );
}

// ── scroll mode: fixed y-axis svg + scrolling main svg + scroll buttons ──────
function ScrollBody({
  classes,
  orch,
  yScale,
  mouseHandlers,
  defs,
  series,
  xAxis,
  showYAxis,
  grid,
  yTickCount,
  ariaLabel,
  prefix,
}: CartesianChartLayoutProps & { prefix: string }) {
  return (
    <>
      <div className={classes?.containerInner ?? `${prefix}-container-inner`}>
        {showYAxis && (
          <div className={classes?.yAxisContainer ?? `${prefix}-y-axis-container`}>
            <svg
              className={classes?.svg}
              width={orch.dimensions.effectiveYAxisWidth}
              height={orch.dimensions.totalHeight}
              data-overflow="visible"
            >
              <g
                className={classes?.group}
                transform={`translate(0, ${orch.dimensions.marginTop})`}
              >
                <YAxis
                  className={classes?.yAxis ?? `${prefix}-y-axis`}
                  tickClassName={classes?.yTick ?? `${prefix}-y-tick`}
                  scale={yScale}
                  width={orch.dimensions.effectiveYAxisWidth}
                  chartHeight={orch.dimensions.chartInnerHeight}
                  tickCount={yTickCount}
                />
              </g>
            </svg>
          </div>
        )}

        <div
          ref={orch.refs.mainContainerRef}
          className={classes?.mainContainer ?? `${prefix}-main-container`}
          onScroll={orch.scroll.handleScroll}
        >
          <svg
            className={classes?.svg}
            role="img"
            aria-label={ariaLabel}
            width={orch.dimensions.chartAreaWidth}
            height={orch.dimensions.totalHeight}
            onMouseMove={mouseHandlers.handleMouseMove}
            onMouseLeave={mouseHandlers.handleMouseLeave}
            onTouchMove={mouseHandlers.handleTouchMove}
            onTouchEnd={mouseHandlers.handleTouchEnd}
            onClick={mouseHandlers.handleClick}
          >
            {defs}
            <g
              className={classes?.group}
              transform={`translate(0, ${orch.dimensions.marginTop})`}
              clipPath={`url(#clip-${orch.identity.chartId})`}
            >
              {grid && (
                <Grid
                  lineClassName={classes?.gridLine}
                  className={classes?.grid ?? `${prefix}-grid`}
                  yScale={yScale}
                  chartWidth={orch.dimensions.chartAreaWidth}
                  chartHeight={orch.dimensions.chartInnerHeight}
                  tickCount={yTickCount}
                />
              )}
              {series}
            </g>
            <g
              className={classes?.group}
              transform={`translate(0, ${orch.dimensions.chartInnerHeight + orch.dimensions.marginTop})`}
            >
              {xAxis}
            </g>
          </svg>
        </div>
      </div>

      <ScrollButtonsHorizontal
        dataWidth={orch.dimensions.dataWidth}
        effectiveWidth={orch.dimensions.containerWidth - orch.dimensions.effectiveYAxisWidth}
        canScrollLeft={orch.scroll.canScrollLeft}
        canScrollRight={orch.scroll.canScrollRight}
        onScrollLeft={() => orch.scroll.scrollTo("left")}
        onScrollRight={() => orch.scroll.scrollTo("right")}
      />
    </>
  );
}

// ── fit mode: one svg, translated g's, transparent hit-rect, no scroll ───────
function FitBody({
  classes,
  orch,
  yScale,
  mouseHandlers,
  defs,
  series,
  xAxis,
  showYAxis,
  grid,
  yTickCount,
  ariaLabel,
  prefix,
}: CartesianChartLayoutProps & { prefix: string }) {
  return (
    <svg
      className={classes?.svg}
      role="img"
      aria-label={ariaLabel}
      width={orch.dimensions.totalSvgWidth}
      height={orch.dimensions.totalHeight}
      data-overflow="visible"
    >
      {defs}

      {showYAxis && (
        <g className={classes?.group} transform={`translate(0, ${orch.dimensions.marginTop})`}>
          <YAxis
            className={classes?.yAxis ?? `${prefix}-y-axis`}
            tickClassName={classes?.yTick ?? `${prefix}-y-tick`}
            scale={yScale}
            width={orch.dimensions.effectiveYAxisWidth}
            chartHeight={orch.dimensions.chartInnerHeight}
            tickCount={yTickCount}
          />
        </g>
      )}

      <g
        className={classes?.group}
        transform={`translate(${orch.dimensions.effectiveYAxisWidth}, ${orch.dimensions.marginTop})`}
        onMouseMove={mouseHandlers.handleMouseMove}
        onMouseLeave={mouseHandlers.handleMouseLeave}
        onTouchMove={mouseHandlers.handleTouchMove}
        onTouchEnd={mouseHandlers.handleTouchEnd}
        onClick={mouseHandlers.handleClick}
      >
        <rect
          className={classes?.hitTarget}
          width={orch.dimensions.chartAreaWidth}
          height={orch.dimensions.chartInnerHeight}
          fill="transparent"
        />
        <g className={classes?.group} clipPath={`url(#clip-${orch.identity.chartId})`}>
          {grid && (
            <Grid
              lineClassName={classes?.gridLine}
              className={classes?.grid ?? `${prefix}-grid`}
              yScale={yScale}
              chartWidth={orch.dimensions.chartAreaWidth}
              chartHeight={orch.dimensions.chartInnerHeight}
              tickCount={yTickCount}
            />
          )}
          {series}
        </g>
      </g>

      <g
        className={classes?.group}
        transform={`translate(${orch.dimensions.effectiveYAxisWidth}, ${orch.dimensions.chartInnerHeight + orch.dimensions.marginTop})`}
      >
        {xAxis}
      </g>
    </svg>
  );
}
