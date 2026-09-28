import { useMemo } from "react";

import {
  useCategoricalChartOrchestrator,
  useEffectiveAnimation,
  useExportChartData,
} from "../hooks";
import { ChartShell } from "../shared/core/ChartShell";
import { DefaultLegend } from "../shared/core/DefaultLegend/DefaultLegend";
import { useResolvedLegendKey } from "../shared/core/legend/LegendStoreProvider";
import { ChartTooltip } from "../shared/core/PortalTooltip/ChartTooltip";
import { ChartWithStackedLegend } from "../shared/core/StackedLegend/ChartWithStackedLegend";
import { CHART_CLASS_PREFIX } from "../utils/constants";
import { RadialBars } from "./parts/RadialBars";
import { RadialGrid } from "./parts/RadialGrid";
import type { RadialChartData, RadialChartProps } from "./types";

const BAR_GAP = 2;

/**
 * `legendVariant="stacked"` (the default, as in react-ui's Recharts RadialChart)
 * lays the chart out with its built-in stacked legend. The inline legend is
 * used for `"default"`, and none when the chart publishes to an external
 * legend (`legendKey`, or a surrounding `LegendStoreProvider`'s key).
 */
export function RadialChart<T extends RadialChartData>(props: RadialChartProps<T>) {
  const { legend = true, legendVariant = "stacked", legendKey, width, height, className } = props;
  const externalLegendKey = useResolvedLegendKey(legendKey);

  if (legend && legendVariant === "stacked" && externalLegendKey === undefined) {
    return (
      <ChartWithStackedLegend width={width} height={height} className={className}>
        <RadialChartImpl {...props} width={undefined} height={undefined} className={undefined} />
      </ChartWithStackedLegend>
    );
  }
  return <RadialChartImpl {...props} />;
}

function RadialChartImpl<T extends RadialChartData>(props: RadialChartProps<T>) {
  const {
    data,
    categoryKey,
    dataKey,
    customPalette,
    variant = "circular",
    format = "number",
    legend: showLegend = true,
    grid: showGrid = false,
    isAnimationActive = false,
    cornerRadius = 10,
    maxChartSize = 500,
    minChartSize = 150,
    height,
    width,
    fitLegendInHeight,
    className,
    onClick,
    legendKey,
  } = props;

  const isSemiCircular = variant === "semiCircular";

  const orch = useCategoricalChartOrchestrator({
    data,
    categoryKey,
    dataKey,
    themePaletteName: "radialChartPalette",
    customPalette,
    format,
    showLegend,
    isSemiCircular,
    maxChartSize,
    minChartSize,
    height,
    width,
    fitLegendInHeight,
    legendKey,
  });

  const animate = useEffectiveAnimation(isAnimationActive);

  // Radial-specific geometry
  const maxRadius = orch.dimensions.chartSize * 0.45;
  const minRadius = maxRadius * 0.25;
  // semiCircular viewport shows the TOP half-plane (centerY sits at the bottom
  // edge), so the sweep must run 9→12→3 o'clock (d3 angles: 0 = 12 o'clock,
  // clockwise) — same convention as PieChart's semiCircular.
  const startAngle = isSemiCircular ? -Math.PI / 2 : 0;
  const endAngle = isSemiCircular ? Math.PI / 2 : 2 * Math.PI;

  const maxValue = useMemo(
    () => Math.max(...orch.data.visibleSlices.map((s) => s.value), 0),
    [orch.data.visibleSlices],
  );

  // PPTX print-export JSON — mirrors react-ui's RadialChart call, which (like
  // its PieChart) emits type:'pie' with a single series = [dataKey] and no
  // extraOptions. Colors are the resolved slice palette in sorted-data order.
  // Undefined off the print path.
  const exportData = useExportChartData({
    type: "pie",
    data: orch.data.sortedData,
    categoryKey: orch.data.catKey,
    dataKeys: [orch.data.valKey],
    colors: orch.data.slices.map((s) => s.color),
    legend: showLegend,
  });

  return (
    <ChartShell
      containerRef={orch.refs.containerRef}
      classPrefix={`${CHART_CLASS_PREFIX}-radial-chart`}
      className={className}
      style={orch.style.containerStyle}
      isEmpty={orch.isEmpty}
      exportData={exportData}
    >
      {() => (
        <>
          <div className={`${CHART_CLASS_PREFIX}-radial-chart-svg-wrapper`}>
            <svg
              width={orch.dimensions.svgWidth}
              height={orch.dimensions.svgHeight}
              viewBox={`0 0 ${orch.dimensions.svgWidth} ${orch.dimensions.svgHeight}`}
              role="img"
              aria-label="Radial chart"
            >
              <g transform={`translate(${orch.dimensions.centerX}, ${orch.dimensions.centerY})`}>
                {showGrid && (
                  <RadialGrid
                    maxRadius={maxRadius}
                    minRadius={minRadius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                  />
                )}
                <RadialBars
                  slices={orch.data.visibleSlices}
                  maxValue={maxValue}
                  maxRadius={maxRadius}
                  minRadius={minRadius}
                  startAngle={startAngle}
                  endAngle={endAngle}
                  cornerRadius={cornerRadius}
                  barGap={BAR_GAP}
                  hoveredIndex={orch.hover.hoveredIndex}
                  animate={animate}
                  data={orch.data.visibleRows}
                  onMouseMove={orch.hover.handleMouseMove}
                  onMouseLeave={orch.hover.handleMouseLeave}
                  onClick={onClick}
                />
              </g>
            </svg>
          </div>

          {showLegend && !orch.usesRemoteLegend && (
            <DefaultLegend
              ref={orch.refs.legendRef}
              items={orch.data.legendItems}
              containerWidth={orch.dimensions.containerWidth}
              isExpanded={orch.legend.isLegendExpanded}
              setIsExpanded={orch.legend.setIsLegendExpanded}
              onItemClick={orch.data.toggleSlice}
              hiddenSeries={orch.data.hiddenSlices}
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
