import clsx from "clsx";
import { useCallback, useMemo } from "react";

import {
  useCartesianChartOrchestrator,
  useEffectiveAnimation,
  useExportChartData,
  useStackedData,
  useXScale,
  useYScale,
} from "../hooks";
import { CartesianXAxis } from "../shared/cartesian/axes/CartesianXAxis";
import { CartesianChartLayout } from "../shared/cartesian/layouts/CartesianChartLayout";
import { LineDotCrosshair } from "../shared/cartesian/LineDotCrosshair";
import { findNearestDataIndex } from "../utils/mouseUtils";
import { AreaSeries } from "./parts/AreaSeries";
import { GradientDefs } from "./parts/GradientDefs";

import { CHART_CLASS_PREFIX } from "../utils/constants";
import type { AreaChartData, AreaChartProps } from "./types";

/**
 * Empty-data guard lives here, in a hook-free dispatcher: the chart impl below
 * calls hooks unconditionally, so the "no data" branch must short-circuit
 * *before* any hook runs (a count → 0 transition on a mounted chart would
 * otherwise break the Rules of Hooks).
 */
export function AreaChart<T extends AreaChartData>(props: AreaChartProps<T>) {
  if (!props.data || props.data.length === 0) {
    return (
      <div
        className={clsx(
          `${CHART_CLASS_PREFIX}-area-chart-container ${CHART_CLASS_PREFIX}-chart-empty`,
          props.className,
        )}
      >
        <span className={`${CHART_CLASS_PREFIX}-chart-empty-text`}>No data available</span>
      </div>
    );
  }
  return <AreaChartImpl {...props} />;
}

// Stacked areas keep one running total per row — a negative value lowers the
// stack — matching Recharts' area charts (bars stack by sign instead).
const AREA_STACK_OFFSET = "none";

function AreaChartImpl<T extends AreaChartData>({
  data,
  categoryKey,
  customPalette,
  variant = "natural",
  tickVariant: tickVariantProp = "multiLine",
  stacked = true,
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
}: AreaChartProps<T>) {
  const animate = useEffectiveAnimation(isAnimationActive);
  const mode = condensed ? "fit" : "scroll";

  const orch = useCartesianChartOrchestrator({
    layout: mode,
    data,
    categoryKey,
    themePaletteName: "areaChartPalette",
    customPalette,
    showLegend,
    showYAxis,
    height,
    fixedWidth,
    fitLegendInHeight,
    tickVariantProp,
    chartIdPrefix: "d3ac",
    icons,
    onClick,
    density,
    stacked,
    stackOffset: AREA_STACK_OFFSET,
    yTickCount,
  });

  const xScale = useXScale(
    data,
    orch.data.catKey,
    orch.dimensions.chartAreaWidth,
    orch.dimensions.widthOfGroup,
  );
  const stackedData = useStackedData(data, orch.data.dataKeys, stacked, AREA_STACK_OFFSET);

  // Unstacked series whose values are entirely <= 0 hang below the zero line —
  // flip their fill gradient so the strongest opacity stays at the data edge.
  // Stacked series sit on the running total, so their gradient never flips.
  const negativeKeys = useMemo(() => {
    const keys = new Set<string>();
    if (stacked) return keys;
    for (const key of orch.data.dataKeys) {
      let max = -Infinity;
      for (const row of data) max = Math.max(max, Number(row[key]) || 0);
      if (max <= 0) keys.add(key);
    }
    return keys;
  }, [data, orch.data.dataKeys, stacked]);
  const yScale = useYScale(
    data,
    orch.data.dataKeys,
    orch.dimensions.chartInnerHeight,
    stacked,
    AREA_STACK_OFFSET,
  );

  const getYValue = useCallback(
    (_row: Record<string, string | number>, key: string, seriesIndex: number) => {
      if (stackedData && orch.hover.hoveredIndex !== null) {
        const series = stackedData[seriesIndex];
        const point = series?.[orch.hover.hoveredIndex];
        // The running total after this series — the edge its line is drawn on.
        return point ? point[1] : 0;
      }
      return Number(_row[key]) || 0;
    },
    [stackedData, orch.hover.hoveredIndex],
  );

  const findIndex = useCallback((mouseX: number) => findNearestDataIndex(xScale, mouseX), [xScale]);
  const mouseHandlers = orch.hover.createMouseHandlers(findIndex);

  // PPTX print-export JSON — mirrors react-ui's AreaChart call (type:'area',
  // no extraOptions). Undefined off the print path.
  const exportData = useExportChartData({
    type: "area",
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
      classPrefix="area-chart"
      chartType="area"
      exportData={exportData}
      ariaLabel="Area chart"
      showYAxis={showYAxis}
      grid={grid}
      showLegend={showLegend}
      xAxisLabel={xAxisLabel}
      yAxisLabel={yAxisLabel}
      yTickCount={yTickCount}
      className={className}
      defs={
        <GradientDefs
          negativeKeys={negativeKeys}
          dataKeys={orch.data.dataKeys}
          transformedKeys={orch.data.transformedKeys}
          colors={orch.data.colorMap}
          chartId={orch.identity.chartId}
          chartWidth={orch.dimensions.chartAreaWidth}
          chartHeight={orch.dimensions.chartInnerHeight}
        />
      }
      series={
        <>
          <AreaSeries
            data={data}
            dataKeys={orch.data.dataKeys}
            xScale={xScale}
            yScale={yScale}
            variant={variant}
            stackedData={stackedData}
            categoryKey={orch.data.catKey}
            transformedKeys={orch.data.transformedKeys}
            colors={orch.data.colorMap}
            chartId={orch.identity.chartId}
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
            classPrefix={`${CHART_CLASS_PREFIX}-area-chart`}
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
          classPrefix={`${CHART_CLASS_PREFIX}-area-chart`}
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
