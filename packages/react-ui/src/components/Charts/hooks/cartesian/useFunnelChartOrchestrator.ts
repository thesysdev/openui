import { useMemo, useRef } from "react";
import type { ChartColorPalette } from "../../../ThemeProvider";
import { useTheme } from "../../../ThemeProvider";

import type { FunnelOrientation } from "../../FunnelChart/parts/funnelGeometry";
import { funnelPercentage } from "../../FunnelChart/parts/funnelGeometry";
import type { TooltipItem } from "../../shared/core/PortalTooltip/ChartTooltip";
import type { ChartData, LegendItem } from "../../types";
import { buildContainerStyle } from "../../utils/buildContainerStyle";
import { DEFAULT_CHART_HEIGHT } from "../../utils/constants";
import { buildColumnKeys } from "../../utils/heatmapUtils";
import { parseLineHeight } from "../../utils/labelWrap";
import { resolvePalette } from "../../utils/paletteUtils";
import { useCanvasContextForLabelSize } from "../core/useCanvasContextForLabelSize";
import { useChartShell } from "../core/useChartShell";
import { usePerElementHover } from "../core/usePerElementHover";
import { useSeriesVisibility } from "../core/useSeriesVisibility";
import { useAutoAngleCalculation } from "./useAutoAngleCalculation";
import { useMaxLabelWidth } from "./useMaxLabelWidth";

// Gap between the funnel plot and its label band/column.
const LABEL_GAP = 6;
// The vertical label column is at most this fraction of the container width…
const MAX_LABEL_COL_RATIO = 0.34;
// …but the cap never drops below this floor (so a tiny container still leaves a
// usable column). NOTE: this floors the CAP, not the column — short labels
// produce a narrower content-fit column.
const MAX_LABEL_COL_FLOOR = 64;

/** A stage's numeric value; non-numeric / missing collapses to 0 (no taper). */
const funnelStageValue = (raw: string | number | undefined): number => {
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
};

export interface FunnelStage {
  /** Unique React key (duplicate labels disambiguated); NOT for display. */
  key: string;
  label: string;
  value: number;
  color: string;
  /** value / geometry-max, clamped to [0, 1] — the cell's leading-edge ratio. */
  norm: number;
  /** The NEXT visible stage's norm — the cell's trailing-edge ratio (taper). */
  normEnd: number;
  /** Percentage relative to the FIRST visible stage (retention). */
  pct: number;
}

export interface UseFunnelChartOrchestratorParams<T extends ChartData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  themePaletteName: keyof ChartColorPalette;
  customPalette?: string[];
  orientation: FunnelOrientation;
  /** Gap between stage cells (px) — matches the painter so the label-angle
   * threshold uses the painter's true cell width. */
  gap: number;
  /** Whether labels render — gates the reserved label band/column. */
  showLabels: boolean;
  showLegend: boolean;
  height?: number | string;
  width?: number | string;
  fitLegendInHeight?: boolean;
}

/**
 * Orchestrator for the funnel: a single-series chart of stacked tapering
 * stages. Standalone fit-only layout (heatmap/scatter precedent) — no axes, so
 * the plot is simply the container minus the legend. The palette is consumed
 * as an ORDERED ramp via resolvePalette (one hue per stage, by INPUT order —
 * never getDistributedColors, which value-sorts + center-out picks). Stage
 * colors are keyed to the ORIGINAL data index so toggling a stage in the
 * legend never recolors the others. Hover is per-stage (the painter owns the
 * mouse handlers; mouse-only, like pie/heatmap).
 */
export function useFunnelChartOrchestrator<T extends ChartData>({
  data,
  categoryKey,
  dataKey,
  themePaletteName,
  customPalette,
  orientation,
  gap,
  showLabels,
  showLegend,
  height,
  width,
  fitLegendInHeight,
}: UseFunnelChartOrchestratorParams<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const {
    hovered: hoveredIndex,
    mousePos,
    handleMouseMove,
    handleMouseLeave,
  } = usePerElementHover();

  const {
    isPrinting,
    containerWidth,
    containerHeight,
    isEmpty,
    legendHeight,
    shouldFitLegend,
    isLegendExpanded,
    setIsLegendExpanded,
  } = useChartShell({
    data,
    showLegend,
    containerRef,
    legendRef,
    width,
    height,
    fitLegendInHeight,
  });
  // For the label line-height (sizing the reserved band). Hydration-safe (SSR
  // stub through the hydration render), so no server/client mismatch.
  const context = useCanvasContextForLabelSize(containerRef);
  const { theme } = useTheme();
  const catKey = String(categoryKey);
  const valKey = String(dataKey);

  // Ordered ramp, one hue per stage by INPUT order.
  const ramp = useMemo(
    () => resolvePalette(theme, themePaletteName, customPalette),
    [theme, themePaletteName, customPalette],
  );

  // Every stage with its stable color (keyed to original index so a legend
  // toggle never recolors the rest).
  const allStages = useMemo(
    () =>
      data.map((row, i) => ({
        label: String(row[catKey]),
        value: funnelStageValue(row[valKey]),
        color: ramp[i % ramp.length] ?? "#000000",
      })),
    [data, catKey, valKey, ramp],
  );

  const stageLabels = useMemo(() => allStages.map((s) => s.label), [allStages]);
  const { hiddenSeries: hiddenStages, toggleSeries: toggleStage } =
    useSeriesVisibility(stageLabels);

  // Visible stages (input order preserved) + the parallel original rows for
  // onClick. norms are computed over the VISIBLE sequence: the geometry-max is
  // the largest visible value (guarantees rings fit, even for non-monotonic
  // edge data) while the percentage reference is the FIRST visible stage.
  const { visibleStages, visibleRows } = useMemo(() => {
    const rows: T[number][] = [];
    const kept = allStages.filter((s, i) => {
      if (hiddenStages.has(s.label)) return false;
      rows.push(data[i]!);
      return true;
    });
    const geomMax = Math.max(1, ...kept.map((s) => Math.max(0, s.value)));
    // `||`, NOT `??`: a first-stage value of 0 (e.g. a partial streamed row
    // whose value field hasn't parsed yet) must fall back to the geometry-max
    // — `??` only catches null/undefined, so a real 0 would make every
    // percentage read 0%. Falsy-0 is exactly the case to catch here.
    const pctRef = kept[0]?.value || geomMax;
    // Unique React keys for duplicate stage labels (LLMs re-emit categories) —
    // a NUL-suffixed occurrence counter, like the heatmap's columns. Stable
    // across streamed appends so existing stages never re-key (no entrance
    // replay). `label` stays the display string.
    const renderKeys = buildColumnKeys(kept.map((s) => s.label));
    const stages: FunnelStage[] = kept.map((s, i) => {
      // The trailing edge tapers toward the next stage; the last stage is a
      // flat rect (its "next" is itself, so normEnd === norm).
      const nextIdx = Math.min(i + 1, kept.length - 1);
      return {
        key: renderKeys[i]!,
        label: s.label,
        value: s.value,
        color: s.color,
        norm: Math.max(0, s.value) / geomMax,
        normEnd: Math.max(0, kept[nextIdx]!.value) / geomMax,
        pct: funnelPercentage(s.value, pctRef),
      };
    });
    return { visibleStages: stages, visibleRows: rows };
  }, [allStages, hiddenStages, data]);

  // --- Tooltip: value + retention for the hovered stage ---
  const tooltipPayload = useMemo(() => {
    if (hoveredIndex === null) return null;
    const stage = visibleStages[hoveredIndex];
    if (!stage) return null;
    const items: TooltipItem[] = [
      { name: "Value", value: stage.value, color: stage.color },
      {
        name: "of first stage",
        value: `${Math.round(stage.pct)}%`,
        color: stage.color,
      },
    ];
    return { label: stage.label, items };
  }, [hoveredIndex, visibleStages]);

  // --- Legend: one item per stage (all stages, so hidden ones can return) ---
  const legendItems: LegendItem[] = useMemo(
    () => allStages.map((s) => ({ key: s.label, label: s.label, color: s.color })),
    [allStages],
  );

  // --- Dimensions (the stage labels are a reserved axis: a bottom band for
  // horizontal, a right column for vertical — like the heatmap's X/Y axes) ---
  const effectiveHeight = containerHeight || (typeof height === "number" ? height : 0);
  const totalHeight = effectiveHeight || DEFAULT_CHART_HEIGHT;
  const legendDeduction = showLegend && shouldFitLegend ? legendHeight : 0;
  const W = containerWidth || 0;
  const H = Math.max(0, totalHeight - legendDeduction);

  const horizontal = orientation === "horizontal";
  // Max label width over ALL stages (not just visible) so toggling a stage in
  // the legend never reflows the axis band.
  const maxLabelWidth = useMaxLabelWidth(data, catKey);
  const visibleCount = Math.max(1, visibleStages.length);
  // Each horizontal label gets one cell's width before it must angle — the
  // SAME width the painter tiles to (gap-subtracted), or the angle threshold
  // and the painter's truncation disagree.
  const perStageWidth =
    horizontal && W > 0 ? Math.max(0, (W - gap * (visibleCount - 1)) / visibleCount) : 0;
  const { angle: labelAngle, height: angledHeight } = useAutoAngleCalculation(
    maxLabelWidth,
    showLabels && horizontal && maxLabelWidth > perStageWidth,
    perStageWidth,
  );

  // Single-line band height from the theme's label line-height (not a magic
  // number) so a larger label font doesn't clip the bottom of the labels.
  const singleLineLabelHeight = Math.ceil(parseLineHeight(context.font));

  // Reserved label band (horizontal: bottom) / column (vertical: right). No
  // reservation when labels are hidden — the funnel reclaims the full area.
  const labelBandHeight =
    !showLabels || !horizontal
      ? 0
      : (labelAngle !== 0 ? Math.max(angledHeight, singleLineLabelHeight) : singleLineLabelHeight) +
        LABEL_GAP;
  const labelColWidth =
    !showLabels || horizontal
      ? 0
      : Math.min(
          Math.ceil(maxLabelWidth) + LABEL_GAP * 2,
          Math.max(MAX_LABEL_COL_FLOOR, Math.round(W * MAX_LABEL_COL_RATIO)),
        );

  // The funnel plot (rings + value + pct) lives in the area the labels don't.
  const ringW = horizontal ? W : Math.max(0, W - labelColWidth);
  const ringH = horizontal ? Math.max(0, H - labelBandHeight) : H;

  const containerStyle = useMemo(() => buildContainerStyle({}, width, height), [width, height]);

  return {
    refs: { containerRef, legendRef },
    isPrinting,
    isEmpty,
    data: {
      visibleStages,
      visibleRows,
      hiddenStages,
      toggleStage,
      legendItems,
    },
    dimensions: {
      containerWidth,
      W,
      H,
      ringW,
      ringH,
      labelBandHeight,
      labelColWidth,
      labelAngle,
    },
    hover: { hoveredIndex, mousePos, handleMouseMove, handleMouseLeave },
    legend: { isLegendExpanded, setIsLegendExpanded },
    tooltip: { tooltipPayload },
    style: { containerStyle },
  };
}
