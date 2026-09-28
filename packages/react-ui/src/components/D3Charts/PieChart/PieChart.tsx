import { arc, pie, type PieArcDatum } from "d3-shape";
import { useMemo } from "react";

import {
  type CategoricalSlice,
  useCategoricalChartOrchestrator,
  useEffectiveAnimation,
  useExportChartData,
} from "../hooks";
import { ChartShell } from "../shared/core/ChartShell";
import { DefaultLegend } from "../shared/core/DefaultLegend/DefaultLegend";
import { ChartTooltip } from "../shared/core/PortalTooltip/ChartTooltip";
import { CHART_CLASS_PREFIX } from "../utils/constants";
import { PieSlices } from "./parts/PieSlices";
import type { PieChartData, PieChartProps } from "./types";

export function PieChart<T extends PieChartData>(props: PieChartProps<T>) {
  const {
    data,
    categoryKey,
    dataKey,
    customPalette,
    variant = "pie",
    appearance = "circular",
    format = "number",
    legend: showLegend = true,
    isAnimationActive = false,
    cornerRadius = 0,
    paddingAngle = 0,
    maxChartSize = 500,
    minChartSize = 150,
    height,
    width,
    fitLegendInHeight,
    className,
    onClick,
    legendKey,
  } = props;

  const isSemiCircular = appearance === "semiCircular";

  const orch = useCategoricalChartOrchestrator({
    data,
    categoryKey,
    dataKey,
    themePaletteName: "pieChartPalette",
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

  // Pie-specific geometry
  const outerRadius = orch.dimensions.chartSize * 0.45;
  const innerRadius = variant === "donut" ? outerRadius * 0.6 : 0;

  const startAngle = isSemiCircular ? -Math.PI / 2 : 0;
  const endAngle = isSemiCircular ? Math.PI / 2 : 2 * Math.PI;

  const pieGenerator = useMemo(
    () =>
      pie<CategoricalSlice>()
        .value((d) => d.value)
        .sort(null)
        .startAngle(startAngle)
        .endAngle(endAngle)
        .padAngle((paddingAngle * Math.PI) / 180),
    [startAngle, endAngle, paddingAngle],
  );

  const arcGenerator = useMemo(
    () =>
      arc<unknown, PieArcDatum<CategoricalSlice>>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .cornerRadius(cornerRadius),
    [innerRadius, outerRadius, cornerRadius],
  );

  const arcs = useMemo(
    () => pieGenerator(orch.data.visibleSlices),
    [pieGenerator, orch.data.visibleSlices],
  );

  // PPTX print-export JSON — mirrors react-ui's PieChart call (type:'pie',
  // single series = [dataKey], no extraOptions). Colors are the resolved slice
  // palette in sorted-data order. Undefined off the print path.
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
      classPrefix={`${CHART_CLASS_PREFIX}-pie-chart`}
      className={className}
      style={orch.style.containerStyle}
      isEmpty={orch.isEmpty}
      exportData={exportData}
    >
      {() => (
        <>
          <div className={`${CHART_CLASS_PREFIX}-pie-chart-svg-wrapper`}>
            <svg
              width={orch.dimensions.svgWidth}
              height={orch.dimensions.svgHeight}
              viewBox={`0 0 ${orch.dimensions.svgWidth} ${orch.dimensions.svgHeight}`}
              role="img"
              aria-label="Pie chart"
            >
              <g transform={`translate(${orch.dimensions.centerX}, ${orch.dimensions.centerY})`}>
                <PieSlices
                  arcs={arcs}
                  arcGenerator={arcGenerator}
                  slices={orch.data.visibleSlices}
                  hoveredIndex={orch.hover.hoveredIndex}
                  entrance={animate}
                  staticRender={orch.isPrinting}
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
