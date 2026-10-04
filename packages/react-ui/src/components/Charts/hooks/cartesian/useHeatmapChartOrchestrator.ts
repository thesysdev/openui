import { scaleBand, scaleQuantize } from "d3-scale";
import { useMemo, useRef } from "react";

import type { ChartColorPalette } from "../../../ThemeProvider";
import { useTheme } from "../../../ThemeProvider";
import type { LegendItem } from "../../types";
import { buildContainerStyle } from "../../utils/buildContainerStyle";
import { CHART_MARGIN_TOP, DEFAULT_CHART_HEIGHT } from "../../utils/constants";
import { getDataKeys } from "../../utils/dataUtils";
import type { HeatmapRampMode } from "../../utils/heatmapUtils";
import {
  buildColumnKeys,
  computeHeatmapColorDomain,
  computeLabelInterval,
} from "../../utils/heatmapUtils";
import {
  DIVERGING_DEFAULT_DARK,
  DIVERGING_DEFAULT_LIGHT,
  orientRampToSurface,
  resolvePalette,
} from "../../utils/paletteUtils";
import { useCanvasContextForLabelSize } from "../core/useCanvasContextForLabelSize";
import { useChartShell } from "../core/useChartShell";
import { useLegendHeight } from "../core/useLegendHeight";
import { usePerElementHover } from "../core/usePerElementHover";
import { useSeriesVisibility } from "../core/useSeriesVisibility";
import { useXAxisHeight } from "./useXAxisHeight";

// Mirror measureYAxisWidth's clamp (its constants are private and its
// formatting is numeric-tick-only — heatmap row labels are category strings).
const MIN_Y_AXIS_WIDTH = 20;
const MAX_Y_AXIS_WIDTH = 200;
const Y_AXIS_PADDING = 10;

// X labels thin out (every n-th) so each shown label gets room for the widest
// label text, between these bounds: at least ~3 characters of the tick font,
// and no more than this so one long label doesn't thin the whole axis (longer
// labels truncate). The gap keeps neighbouring labels apart.
const MIN_X_LABEL_PX = 28;
const MAX_X_LABEL_PX = 64;
const X_LABEL_GAP = 8;

export interface HoveredHeatmapCell {
  rowKey: string;
  columnIndex: number;
  columnLabel: string;
  /** null = the cell has no numeric value. */
  value: number | null;
}

/**
 * A cell's numeric value, or null for "no value". Empty/whitespace-only
 * strings are treated as missing — `Number('')` is 0, which would otherwise
 * paint blank cells as value-0 AND drag the quantize domain's min to 0,
 * recoloring every other cell. Single source of truth for the extent scan,
 * the cell renderer, and the legend row means — they must agree or the color
 * domain and the painted cells drift apart.
 */
export const heatmapCellValue = (raw: string | number | undefined): number | null => {
  if (raw === undefined || (typeof raw === "string" && raw.trim() === "")) {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

/** Tooltip context rows show means at one decimal — enough to compare by. */
const roundMean = (mean: number): number => Math.round(mean * 10) / 10;

export interface UseHeatmapChartOrchestratorParams<
  T extends Array<Record<string, string | number>>,
> {
  data: T;
  categoryKey: keyof T[number];
  themePaletteName: keyof ChartColorPalette;
  customPalette?: string[];
  rampMode: HeatmapRampMode;
  showLegend: boolean;
  showColorScale: boolean;
  showYAxis: boolean;
  height?: number | string;
  width?: number | string;
  fitLegendInHeight?: boolean;
}

/**
 * Orchestrator for the heatmap: a band×band grid where the VALUE axis is
 * color. Follows useScatterChartOrchestrator's standalone fit-only shape, with
 * three deliberate differences: the y axis is categorical (row labels measured
 * as text, not numeric ticks), the palette is consumed as an ORDERED ramp via
 * resolvePalette (never getDistributedColors — a heatmap wants the gradient,
 * not center-out series picks), and hover is per-cell (the chart's cells own
 * their mouse handlers; there is no plot-level hit search). Per-cell hover is
 * the pie/radial regime and, like those charts, is mouse-only for now — touch
 * support belongs to a unified pass over the per-element-handler charts, not
 * a heatmap one-off.
 */
export function useHeatmapChartOrchestrator<T extends Array<Record<string, string | number>>>({
  data,
  categoryKey,
  themePaletteName,
  customPalette,
  rampMode,
  showLegend,
  showColorScale,
  showYAxis,
  height,
  width,
  fitLegendInHeight,
}: UseHeatmapChartOrchestratorParams<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const colorScaleRef = useRef<HTMLDivElement>(null);
  const {
    hovered: hoveredCell,
    mousePos,
    handleMouseMove: handleCellMouseMove,
    handleMouseLeave,
  } = usePerElementHover<HoveredHeatmapCell>();

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
    // Heatmap is ALSO empty when row 0 carries no series keys — nothing to
    // draw even with rows present, which a bare row count can't see.
    isEmptyOverride:
      !data || data.length === 0 || getDataKeys(data, String(categoryKey)).length === 0,
  });
  // Same measured-deduction mechanism as the legend: the color-scale strip is
  // HTML below the svg, so its real height (typography-dependent) comes from
  // observation, not a constant. Shares the shell's isEmpty so the strip
  // remounts/re-observes in lockstep with the legend.
  const colorScaleHeight = useLegendHeight(colorScaleRef, showColorScale && !isEmpty);
  const context = useCanvasContextForLabelSize(containerRef);
  const { theme, mode } = useTheme();

  const catKey = String(categoryKey);

  // --- Data shape: columns from the category field, rows from the series keys ---
  const columns = useMemo(() => data.map((row) => String(row[catKey])), [data, catKey]);
  const rowKeys = useMemo(() => getDataKeys(data, catKey), [data, catKey]);

  const { hiddenSeries: hiddenRows, toggleSeries: toggleRow } = useSeriesVisibility(rowKeys);

  const visibleRowKeys = useMemo(
    () => rowKeys.filter((key) => !hiddenRows.has(key)),
    [rowKeys, hiddenRows],
  );

  // --- Color: ordered ramp quantized over the visible value extent ---
  // Diverging mode without a customPalette uses the built-in two-hue ramps:
  // the theme's sequential ramp can't express "neutral at zero" (mirroring it
  // would give both signs the same hue). A customPalette always wins — in
  // diverging mode it's read as the full low→neutral→high ramp.
  const ramp = useMemo(() => {
    if (rampMode === "diverging" && !customPalette) {
      return mode === "dark" ? DIVERGING_DEFAULT_DARK : DIVERGING_DEFAULT_LIGHT;
    }
    // A customPalette is used as given; the theme's palette is oriented so low
    // values sit nearest the surface.
    return customPalette
      ? resolvePalette(theme, themePaletteName, customPalette)
      : orientRampToSurface(resolvePalette(theme, themePaletteName), mode);
  }, [rampMode, customPalette, mode, theme, themePaletteName]);

  const [minValue, maxValue] = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const row of data) {
      for (const key of visibleRowKeys) {
        const value = heatmapCellValue(row[key]);
        if (value !== null) {
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      }
    }
    if (!Number.isFinite(min)) return [0, 1];
    return [min, max];
  }, [data, visibleRowKeys]);

  const colorScale = useMemo(() => {
    // Domain rules (collapsed-extent widening; diverging = symmetric about
    // zero) live in computeHeatmapColorDomain — unit-tested there.
    const [domainMin, domainMax] = computeHeatmapColorDomain(minValue, maxValue, rampMode);
    return scaleQuantize<string>().domain([domainMin, domainMax]).range(ramp);
  }, [minValue, maxValue, rampMode, ramp]);

  // The color-scale legend strip: one swatch per ramp bucket, each with the
  // exact value range the quantize scale assigns it — honest by construction.
  // Extents come from thresholds() BY INDEX, not invertExtent(color):
  // invertExtent looks colors up with indexOf, so a customPalette that
  // repeats a color would hand every repeat the FIRST occurrence's range.
  const colorScaleBuckets = useMemo(() => {
    const [domainMin, domainMax] = colorScale.domain();
    const thresholds = colorScale.thresholds();
    return ramp.map((color, index) => ({
      color,
      lo: index === 0 ? domainMin : thresholds[index - 1]!,
      hi: index === ramp.length - 1 ? domainMax : thresholds[index]!,
    }));
  }, [ramp, colorScale]);

  // --- Dimensions (scatter's standalone fit math) ---
  // Width measured over ALL rows (not just visible) so toggling a row in the
  // legend doesn't shift the whole plot horizontally.
  const yAxisWidth = useMemo(() => {
    if (!showYAxis) return 0;
    let max = 0;
    for (const key of rowKeys) {
      max = Math.max(max, context.measureText(key).width);
    }
    return Math.max(MIN_Y_AXIS_WIDTH, Math.min(MAX_Y_AXIS_WIDTH, Math.ceil(max) + Y_AXIS_PADDING));
  }, [showYAxis, rowKeys, context]);

  const xAxisHeight = useXAxisHeight(data, catKey, "singleLine");

  const effectiveHeight = containerHeight || (typeof height === "number" ? height : 0);
  const totalHeight = effectiveHeight || DEFAULT_CHART_HEIGHT;
  const legendDeduction = showLegend && shouldFitLegend ? legendHeight : 0;
  const colorScaleDeduction = showColorScale && shouldFitLegend ? colorScaleHeight : 0;
  const chartInnerHeight =
    totalHeight - CHART_MARGIN_TOP - xAxisHeight - legendDeduction - colorScaleDeduction;
  const chartAreaWidth = Math.max(0, (containerWidth || 0) - yAxisWidth);

  const totalSvgWidth = containerWidth || 0;
  const totalSvgHeight = CHART_MARGIN_TOP + Math.max(0, chartInnerHeight) + xAxisHeight;

  // --- Scales (band × band; cell gap is applied at render time so it stays
  // an exact pixel inset instead of a proportional band padding) ---
  const xScale = useMemo(
    () => scaleBand<string>().domain(columns).range([0, chartAreaWidth]),
    [columns, chartAreaWidth],
  );

  // React keys for the cell columns — duplicate labels disambiguated (the
  // x scale interns duplicates into one band, but React keys must be unique).
  const columnKeys = useMemo(() => buildColumnKeys(columns), [columns]);

  // Thin the x labels once columns get narrower than their labels. The step
  // comes from the SCALE: its domain interns duplicate labels, and XAxis thins
  // over those unique bands — columns.length would over-count (and over-thin)
  // whenever an LLM re-emits a category.
  const widestColumnLabel = useMemo(
    () => columns.reduce((max, label) => Math.max(max, context.measureText(label).width), 0),
    [columns, context],
  );
  const labelInterval = computeLabelInterval(
    xScale.step(),
    Math.min(MAX_X_LABEL_PX, Math.max(MIN_X_LABEL_PX, widestColumnLabel)) + X_LABEL_GAP,
  );
  const yScale = useMemo(
    () =>
      scaleBand<string>()
        .domain(visibleRowKeys)
        .range([0, Math.max(0, chartInnerHeight)]),
    [visibleRowKeys, chartInnerHeight],
  );

  // --- Row/column means: tooltip context + the row-legend swatch colors.
  // Row means scan ALL columns (a hidden row's swatch should still summarize
  // its own data); column means scan only VISIBLE rows (they contextualize
  // what's on screen).
  const rowMeans = useMemo(() => {
    const means = new Map<string, number>();
    for (const key of rowKeys) {
      let sum = 0;
      let count = 0;
      for (const row of data) {
        const value = heatmapCellValue(row[key]);
        if (value !== null) {
          sum += value;
          count++;
        }
      }
      if (count > 0) means.set(key, sum / count);
    }
    return means;
  }, [rowKeys, data]);

  const columnMeans = useMemo(
    () =>
      data.map((row) => {
        let sum = 0;
        let count = 0;
        for (const key of visibleRowKeys) {
          const value = heatmapCellValue(row[key]);
          if (value !== null) {
            sum += value;
            count++;
          }
        }
        return count > 0 ? sum / count : null;
      }),
    [data, visibleRowKeys],
  );

  // --- Tooltip ---
  const tooltipPayload = useMemo(() => {
    if (!hoveredCell) return null;
    const { rowKey, columnIndex, columnLabel, value } = hoveredCell;
    if (value === null) {
      // An empty cell is still a place on the grid — name it instead of
      // leaving a tooltip-less dead zone indistinguishable from a miss.
      return {
        label: columnLabel,
        items: [{ name: rowKey, value: "No value", color: "transparent" }],
      };
    }
    const items: { name: string; value: number | string; color: string }[] = [
      { name: rowKey, value, color: colorScale(value) },
    ];
    // Context rows: where this cell sits against its row and column. The
    // swatches are the means' own quantize colors — a ramp readout for free.
    const rowMean = rowMeans.get(rowKey);
    if (data.length > 1 && rowMean !== undefined) {
      items.push({
        name: "Row avg",
        value: roundMean(rowMean),
        color: colorScale(rowMean),
      });
    }
    const columnMean = columnMeans[columnIndex];
    if (visibleRowKeys.length > 1 && columnMean != null) {
      items.push({
        name: "Column avg",
        value: roundMean(columnMean),
        color: colorScale(columnMean),
      });
    }
    return { label: columnLabel, items };
  }, [hoveredCell, colorScale, rowMeans, columnMeans, data, visibleRowKeys]);

  // --- Legend: one item per row. A row has no single color under a value
  // ramp, so the swatch shows the quantize color of the row's MEAN value —
  // a row-level summary that keeps swatches distinguishable. ---
  const legendItems: LegendItem[] = useMemo(
    () =>
      rowKeys.map((key) => {
        const mean = rowMeans.get(key);
        const midColor = ramp[Math.floor(ramp.length / 2)] ?? "#000000";
        return {
          key,
          label: key,
          color: mean !== undefined ? colorScale(mean) : midColor,
        };
      }),
    [rowKeys, rowMeans, colorScale, ramp],
  );

  const containerStyle = useMemo(() => buildContainerStyle({}, width, height), [width, height]);

  return {
    refs: { containerRef, legendRef, colorScaleRef },
    isPrinting,
    isEmpty,
    data: {
      catKey,
      columns,
      columnKeys,
      rowKeys,
      visibleRowKeys,
      hiddenRows,
      toggleRow,
    },
    dimensions: {
      containerWidth,
      effectiveYAxisWidth: yAxisWidth,
      chartAreaWidth,
      chartInnerHeight: Math.max(0, chartInnerHeight),
      totalSvgWidth,
      totalSvgHeight,
      xAxisHeight,
      labelInterval,
      CHART_MARGIN_TOP,
    },
    scales: { xScale, yScale, colorScale },
    colorScaleLegend: {
      buckets: colorScaleBuckets,
      domainMin: colorScale.domain()[0],
      domainMax: colorScale.domain()[1],
    },
    hover: { hoveredCell, mousePos, handleCellMouseMove, handleMouseLeave },
    legend: { legendItems, isLegendExpanded, setIsLegendExpanded },
    tooltip: { tooltipPayload },
    style: { containerStyle },
  };
}
