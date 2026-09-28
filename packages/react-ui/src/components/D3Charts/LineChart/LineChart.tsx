import clsx from "clsx";
import { useCallback } from "react";

import {
  useCartesianChartOrchestrator,
  useEffectiveAnimation,
  useExportChartData,
  useXScale,
  useYScale,
} from "../hooks";
import { CartesianXAxis } from "../shared/cartesian/axes/CartesianXAxis";
import { ClipDefs } from "../shared/cartesian/ClipDefs";
import { CartesianChartLayout } from "../shared/cartesian/layouts/CartesianChartLayout";
import { LineDotCrosshair } from "../shared/cartesian/LineDotCrosshair";
import { findNearestDataIndex } from "../utils/mouseUtils";
import { LineSeries } from "./parts/LineSeries";

import { CHART_CLASS_PREFIX } from "../utils/constants";
import type { LineChartData, LineChartProps } from "./types";

/**
 * Empty-data guard lives here, in a hook-free dispatcher: the chart impl below
 * calls hooks unconditionally, so the "no data" branch must short-circuit
 * *before* any hook runs (a count → 0 transition on a mounted chart would
 * otherwise break the Rules of Hooks).
 */
export function LineChart<T extends LineChartData>(props: LineChartProps<T>) {
  if (!props.data || props.data.length === 0) {
    return (
      <div
        className={clsx(
          `${CHART_CLASS_PREFIX}-line-chart-container ${CHART_CLASS_PREFIX}-chart-empty`,
          props.className,
        )}
      >
        <span className={`${CHART_CLASS_PREFIX}-chart-empty-text`}>No data available</span>
      </div>
    );
  }
  return <LineChartImpl {...props} />;
}

function LineChartImpl<T extends LineChartData>({
  data,
  categoryKey,
  customPalette,
  variant = "natural",
  tickVariant: tickVariantProp = "multiLine",
  showDots = false,
  dotRadius = 3,
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
  crosshair = false,
  highlight = false,
  activeDots = true,
  yTickCount,
}: LineChartProps<T>) {
  const animate = useEffectiveAnimation(isAnimationActive);
  const mode = condensed ? "fit" : "scroll";

  const orch = useCartesianChartOrchestrator({
    layout: mode,
    data,
    categoryKey,
    themePaletteName: "lineChartPalette",
    customPalette,
    showLegend,
    showYAxis,
    height,
    fixedWidth,
    fitLegendInHeight,
    tickVariantProp,
    chartIdPrefix: "d3lc",
    icons,
    onClick,
    density,
    yTickCount,
  });

  const xScale = useXScale(
    data,
    orch.data.catKey,
    orch.dimensions.chartAreaWidth,
    orch.dimensions.widthOfGroup,
  );
  const yScale = useYScale(data, orch.data.dataKeys, orch.dimensions.chartInnerHeight, false);

  const getYValue = useCallback(
    (row: Record<string, string | number>, key: string) => Number(row[key]) || 0,
    [],
  );

  const findIndex = useCallback((mouseX: number) => findNearestDataIndex(xScale, mouseX), [xScale]);
  const mouseHandlers = orch.hover.createMouseHandlers(findIndex);

  // PPTX print-export JSON — mirrors react-ui's LineChart call (type:'line').
  // react-ui also passes `extraOptions: { lineSize: strokeWidth }`, but viz's
  // LineChart exposes no stroke-width prop (stroke is CSS-driven), so there is
  // no real value to emit — the field is omitted rather than faked. Undefined
  // off the print path.
  const exportData = useExportChartData({
    type: "line",
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
      orch={orch}
      yScale={yScale}
      mouseHandlers={mouseHandlers}
      classPrefix="line-chart"
      chartType="line"
      exportData={exportData}
      ariaLabel="Line chart"
      showYAxis={showYAxis}
      grid={grid}
      showLegend={showLegend}
      xAxisLabel={xAxisLabel}
      yAxisLabel={yAxisLabel}
      yTickCount={yTickCount}
      className={className}
      defs={
        <defs>
          <ClipDefs
            chartId={orch.identity.chartId}
            chartWidth={orch.dimensions.chartAreaWidth}
            chartHeight={orch.dimensions.chartInnerHeight}
          />
        </defs>
      }
      series={
        <>
          <LineSeries
            data={data}
            dataKeys={orch.data.dataKeys}
            xScale={xScale}
            yScale={yScale}
            variant={variant}
            categoryKey={orch.data.catKey}
            colors={orch.data.colorMap}
            showDots={showDots}
            dotRadius={dotRadius}
            isAnimationActive={animate}
          />
          <LineDotCrosshair
            hoveredIndex={orch.hover.hoveredIndex}
            xScale={xScale}
            yScale={yScale}
            data={data}
            dataKeys={orch.data.dataKeys}
            categoryKey={orch.data.catKey}
            colors={orch.data.colorMap}
            chartHeight={orch.dimensions.chartInnerHeight}
            getYValue={getYValue}
            classPrefix={`${CHART_CLASS_PREFIX}-line-chart`}
            crosshair={crosshair}
            highlight={highlight}
            activeDots={activeDots}
          />
        </>
      }
      xAxis={
        <CartesianXAxis
          mode={mode}
          scale={xScale}
          classPrefix={`${CHART_CLASS_PREFIX}-line-chart`}
          tickVariant={orch.dimensions.tickVariant}
          widthOfGroup={orch.dimensions.widthOfGroup}
          labelHeight={orch.xAxis.xAxisHeight}
          labelInterval={orch.dimensions.labelInterval}
          angle={orch.xAxis.angle}
        />
      }
    />
  );
}
