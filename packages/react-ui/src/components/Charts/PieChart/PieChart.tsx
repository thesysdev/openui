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
import { useResolvedLegendKey } from "../shared/core/legend/LegendStoreProvider";
import { ChartTooltip } from "../shared/core/PortalTooltip/ChartTooltip";
import { ChartWithStackedLegend } from "../shared/core/StackedLegend/ChartWithStackedLegend";
import { CHART_CLASS_PREFIX } from "../utils/constants";
import { PieSlices } from "./parts/PieSlices";
import type { PieChartData, PieChartProps } from "./types";

// The donut is the Recharts two-ring design: a thin band in the slice colors
// over sunk-colored "track" wedges, with a small hole at the center.
/** Where the colored band starts, as a share of the radius (the outer tenth). */
const DONUT_BAND_INNER = 0.9;
/** The center hole's radius, as a share of the band's inner radius. */
const DONUT_HOLE = 0.28;
/** Degrees between donut slices; `paddingAngle` sets the pie's only. */
const DONUT_PADDING_ANGLE = 0.5;

/**
 * `legendVariant="stacked"` (the default) lays the chart out with its built-in stacked legend. The inline legend is
 * used for `"default"`, and none when the chart publishes to an external
 * legend (`legendKey`, or a surrounding `LegendStoreProvider`'s key).
 */
export function PieChart<T extends PieChartData>(props: PieChartProps<T>) {
  const { legend = true, legendVariant = "stacked", legendKey, width, height, className } = props;
  const externalLegendKey = useResolvedLegendKey(legendKey);

  if (legend && legendVariant === "stacked" && externalLegendKey === undefined) {
    return (
      <ChartWithStackedLegend width={width} height={height} className={className}>
        <PieChartImpl {...props} width={undefined} height={undefined} className={undefined} />
      </ChartWithStackedLegend>
    );
  }
  return <PieChartImpl {...props} />;
}

function PieChartImpl<T extends PieChartData>(props: PieChartProps<T>) {
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
  const isDonut = variant === "donut";
  const padAngle = isDonut ? DONUT_PADDING_ANGLE : paddingAngle;
  const outerRadius = orch.dimensions.chartSize * 0.45;
  const innerRadius = isDonut ? outerRadius * DONUT_BAND_INNER : 0;
  const holeRadius = innerRadius * DONUT_HOLE;

  const startAngle = isSemiCircular ? -Math.PI / 2 : 0;
  const endAngle = isSemiCircular ? Math.PI / 2 : 2 * Math.PI;

  const pieGenerator = useMemo(
    () =>
      pie<CategoricalSlice>()
        .value((d) => d.value)
        .sort(null)
        .startAngle(startAngle)
        .endAngle(endAngle)
        .padAngle((padAngle * Math.PI) / 180),
    [startAngle, endAngle, padAngle],
  );

  const arcGenerator = useMemo(() => {
    const generator = arc<unknown, PieArcDatum<CategoricalSlice>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(cornerRadius);
    // The donut's band and track share one pad radius, so each gap between
    // slices runs straight through both rings.
    return isDonut ? generator.padRadius(outerRadius) : generator;
  }, [isDonut, innerRadius, outerRadius, cornerRadius]);

  // Donut only: the track wedge under each band segment, and the hover area
  // that spans both.
  const donutArcs = useMemo(() => {
    if (!isDonut) return undefined;
    const donutArc = (inner: number, outer: number) =>
      arc<unknown, PieArcDatum<CategoricalSlice>>()
        .innerRadius(inner)
        .outerRadius(outer)
        .padRadius(outerRadius);
    return {
      track: donutArc(holeRadius, innerRadius).cornerRadius(cornerRadius),
      hit: donutArc(holeRadius, outerRadius),
    };
  }, [isDonut, holeRadius, innerRadius, outerRadius, cornerRadius]);

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
                  trackArcGenerator={donutArcs?.track}
                  hitArcGenerator={donutArcs?.hit}
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
