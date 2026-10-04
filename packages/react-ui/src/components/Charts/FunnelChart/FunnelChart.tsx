import { useEffectiveAnimation } from "../hooks";
import { useFunnelChartOrchestrator } from "../hooks/cartesian/useFunnelChartOrchestrator";
import { ChartShell } from "../shared/core/ChartShell";
import { DefaultLegend } from "../shared/core/DefaultLegend/DefaultLegend";
import { ChartTooltip } from "../shared/core/PortalTooltip/ChartTooltip";
import { CHART_CLASS_PREFIX } from "../utils/constants";
import { FunnelStages } from "./parts/FunnelStages";
import type { FunnelChartData, FunnelChartProps } from "./types";

const CLASS_PREFIX = `${CHART_CLASS_PREFIX}-funnel-chart`;
// Gap between stage cells (px). Internal — a flat public `gap` prop can be
// added later if a consumer needs it; no demand yet.
const STAGE_GAP = 4;

export function FunnelChart<T extends FunnelChartData>(props: FunnelChartProps<T>) {
  const {
    data,
    categoryKey,
    dataKey,
    orientation = "horizontal",
    edges = "curved",
    layers = 3,
    customPalette,
    showLabels = true,
    showValues = true,
    showPercentage = true,
    legend: showLegend = true,
    isAnimationActive = false,
    height,
    width,
    fitLegendInHeight,
    className,
    onClick,
  } = props;

  const orch = useFunnelChartOrchestrator({
    data,
    categoryKey,
    dataKey,
    // No funnelChartPalette token on react-ui's ChartColorPalette yet (same
    // gap as heatmap/scatter) — the catch-all default palette is the token.
    themePaletteName: "defaultChartPalette",
    customPalette,
    orientation,
    gap: STAGE_GAP,
    showLabels,
    showLegend,
    height,
    width,
    fitLegendInHeight,
  });

  const animate = useEffectiveAnimation(isAnimationActive);

  const {
    dimensions: { W, H, ringW, ringH, labelColWidth, labelAngle, angledLabelMaxWidth },
  } = orch;

  return (
    <ChartShell
      containerRef={orch.refs.containerRef}
      classPrefix={CLASS_PREFIX}
      className={className}
      style={orch.style.containerStyle}
      isEmpty={orch.isEmpty}
    >
      {() => (
        <>
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            style={{ overflow: "visible" }}
            role="img"
            aria-label="Funnel chart"
          >
            {W > 0 && H > 0 && (
              <FunnelStages
                stages={orch.data.visibleStages}
                rows={orch.data.visibleRows}
                orientation={orientation}
                edges={edges}
                layers={layers}
                W={W}
                H={H}
                ringW={ringW}
                ringH={ringH}
                labelColWidth={labelColWidth}
                labelAngle={labelAngle}
                angledLabelMaxWidth={angledLabelMaxWidth}
                gap={STAGE_GAP}
                showLabels={showLabels}
                showValues={showValues}
                showPercentage={showPercentage}
                animate={animate}
                staticRender={orch.isPrinting}
                hoveredIndex={orch.hover.hoveredIndex}
                onMouseMove={orch.hover.handleMouseMove}
                onMouseLeave={orch.hover.handleMouseLeave}
                onClick={onClick}
              />
            )}
          </svg>

          {showLegend && (
            <DefaultLegend
              ref={orch.refs.legendRef}
              items={orch.data.legendItems}
              containerWidth={orch.dimensions.containerWidth}
              isExpanded={orch.legend.isLegendExpanded}
              setIsExpanded={orch.legend.setIsLegendExpanded}
              onItemClick={orch.data.toggleStage}
              hiddenSeries={orch.data.hiddenStages}
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
