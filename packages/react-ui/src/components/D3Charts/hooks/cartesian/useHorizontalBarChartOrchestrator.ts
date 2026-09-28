import type { ScaleLinear } from "d3-scale";
import { scaleLinear } from "d3-scale";
import { pointer } from "d3-selection";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  BAR_GAP,
  BAR_HEIGHT,
  BAR_RADIUS,
  barValue,
  contentHeight as computeContentHeight,
  groupHeight as computeGroupHeight,
  rowOffsets as computeRowOffsets,
  snapPositions as computeSnapPositions,
  nearestSnap,
  radiusArray,
  showInternalLine,
  stackSegments,
  valueDomain,
  verticalPadding,
  X_AXIS_HEIGHT,
} from "../../BarChart/parts/horizontalBarGeometry";
import type { BarChartData, BarChartProps } from "../../BarChart/types";
import type { TooltipItem } from "../../shared/core/PortalTooltip/ChartTooltip";
import type { LegendItem } from "../../types";
import { buildContainerStyle } from "../../utils/buildContainerStyle";
import { DEFAULT_CHART_HEIGHT } from "../../utils/constants";
import { getDataKeys } from "../../utils/dataUtils";
import { buildColumnKeys } from "../../utils/heatmapUtils";
import { parseLineHeight } from "../../utils/labelWrap";
import { useChartPalette } from "../../utils/paletteUtils";
import { numberTickFormatter } from "../../utils/styleUtils";
import { useCanvasContextForLabelSize } from "../core/useCanvasContextForLabelSize";
import { useChartShell } from "../core/useChartShell";
import { useSeriesVisibility } from "../core/useSeriesVisibility";

/**
 * Small left margin (px) so the value-zero line / leftmost bar isn't flush
 * against the container edge. Kept SMALL — smaller than the category label's
 * left padding — so the leftmost gridline sits in the label's PADDING, never
 * through its text (the bug a bigger inset caused). Edge tick-label clipping is
 * handled by `NumericXAxis edgeAlign`, NOT by insetting the scale.
 */
const AXIS_PAD = 2;
/** Minimum px between value ticks — matched to `NumericXAxis`/`VerticalGrid` so
 *  the shared scale produces the same ticks in the grid and the bottom axis. */
const TICK_MIN_SPACING = 60;

/** One rendered bar (a whole grouped bar, or one segment of a stacked bar). */
export interface HorizontalBar {
  /** React key within the row (grouped: the series key; stacked: the segment
   *  key). */
  key: string;
  /** The series this bar/segment belongs to (drives color + tooltip). */
  seriesKey: string;
  /** Left edge (px) in the row SVG's coordinate space; negatives extend left of
   *  `valueScale(0)`, so `x` is already the LEFT edge for either sign. */
  x: number;
  /** Top edge (px) in the row SVG's coordinate space. */
  y: number;
  /** Bar extent along the value axis (px), always `>= 0`. */
  width: number;
  /** Cross-axis thickness (px) — always `BAR_HEIGHT`. */
  height: number;
  /** Series color (distributed palette, keyed to input order — matches the
   *  vertical BarChart). */
  color: string;
  /** Per-corner radii `[tl, tr, br, bl]` for `roundedBarPath`. */
  radii: [number, number, number, number];
  /** Value is `< 0` — the bar draws left of the zero line. */
  isNegative: boolean;
  /** Bar is wide enough to carry its internal decorative line. */
  showLine: boolean;
  /** The finite, signed value this bar represents. */
  value: number;
}

/** One category row: its label band plus every bar drawn under it. */
export interface HorizontalBarRow {
  /** Stable React key (duplicate categories disambiguated); NOT for display. */
  key: string;
  /** The category label (display string). */
  category: string;
  /** Top edge (px) of the whole group (label + bars) in the row SVG. */
  rowTop: number;
  /** Height (px) of the whole group — uniform across rows. */
  groupHeight: number;
  /** Bars under this row: grouped → one per visible series; stacked → the
   *  sign-diverging segments (positives then negatives). */
  bars: HorizontalBar[];
}

/**
 * Private orchestrator for the HORIZONTAL BarChart — the integration layer that
 * turns `BarChartProps` into a render-ready structure for the row renderer
 * (`HorizontalBarSeries`) and the shell (`HorizontalBarChartImpl`). Mirrors the
 * `ScatterChart`/`FunnelChart` precedent: renders through `ChartShell` WITHOUT
 * `CartesianChartLayout`, so it touches none of the shared vertical Line/Area
 * machinery.
 *
 * All orientation math is delegated to the pure `horizontalBarGeometry` module
 * (group/content heights, row offsets, snap targets, value domain, stack split,
 * corner radii, internal-line threshold); this hook is glue — measurement,
 * scales, per-row bar geometry, hover hit-testing, tooltip payload, and the
 * vertical snap-scroll state.
 *
 * @param props         The BarChart props (already on the horizontal path).
 * @param containerRef  Attached by the shell to the measured container (feeds
 *                      `useChartShell`'s size + emptiness).
 * @param scrollBodyRef Attached by the shell to the `overflow-y:auto` scroll
 *                      body; read for `scrollTop`/`scrollHeight`/`clientHeight`
 *                      to drive the snap-scroll buttons.
 *
 * Returned shape (consumed by Task 5/6):
 * - `isEmpty`, `isPrinting` — from the shell.
 * - `legendRef`, `containerStyle` — wire the legend + container.
 * - `dataKeys` (visible series), `colors` (parallel to `dataKeys`),
 *   `legendItems` (ALL series), `labelHeight` (measured band height).
 * - `valueScale` (zero-anchored, `.nice()`), `ticks`, `formatTick`.
 * - `rows` (one `HorizontalBarRow` per category, data order), `rowOffsets`,
 *   `groupHeight` (uniform row height, for the hover crosshair band),
 *   `snapPositions`, `contentHeight` (raw), `svgHeight` (drawn, incl. pad),
 *   `topPad`, `bodyHeight`, `chartWidth`, `chartHeight`.
 * - `hover` { hoveredIndex, hoveredCategory, onMouseMove, onMouseLeave }.
 * - `tooltip` { payload, position }.
 * - `legend` { hiddenSeries, toggleSeries, isLegendExpanded, setIsLegendExpanded }.
 * - `scroll` { canUp, canDown, needsScroll, onScrollUp, onScrollDown, onScroll }.
 */
export function useHorizontalBarChartOrchestrator<T extends BarChartData>(
  props: BarChartProps<T>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  scrollBodyRef: React.RefObject<HTMLDivElement | null>,
) {
  const {
    data,
    categoryKey,
    variant = "grouped",
    customPalette,
    barRadius = BAR_RADIUS,
    legend: showLegend = true,
    height,
    width,
    fitLegendInHeight,
  } = props;

  const catKey = String(categoryKey);
  const legendRef = useRef<HTMLDivElement>(null);
  const context = useCanvasContextForLabelSize(containerRef);

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

  // --- Series keys + visibility (legend toggle hides a series, matching the
  // vertical BarChart's useChartData path) ---
  const allDataKeys = useMemo(() => getDataKeys(data, catKey), [data, catKey]);
  const { hiddenSeries, toggleSeries } = useSeriesVisibility(allDataKeys);
  const dataKeys = useMemo(
    () => allDataKeys.filter((k) => !hiddenSeries.has(k)),
    [allDataKeys, hiddenSeries],
  );

  // --- Colors: DISTRIBUTED (middle-out) across the series, keyed to the
  // ORIGINAL index so a legend toggle never recolors the rest. This is the
  // SAME resolution the vertical BarChart uses — useChartData →
  // useChartPalette → getDistributedColors(resolvePalette(theme,
  // 'barChartPalette', customPalette), allDataKeys.length) — so a horizontal
  // and a vertical BarChart on the same data color identically (and match
  // openui, which also distributes rather than reading the raw ordered ramp).
  // ---
  const ramp = useChartPalette({
    customPalette,
    themePaletteName: "barChartPalette",
    dataLength: allDataKeys.length,
  });
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    allDataKeys.forEach((key, i) => {
      map[key] = ramp[i] ?? "#000000";
    });
    return map;
  }, [allDataKeys, ramp]);
  const colors = useMemo(
    () => dataKeys.map((key) => colorMap[key] ?? "#000000"),
    [dataKeys, colorMap],
  );

  const legendItems: LegendItem[] = useMemo(
    () =>
      allDataKeys.map((key) => ({
        key,
        label: key,
        color: colorMap[key] ?? "#000000",
      })),
    [allDataKeys, colorMap],
  );

  // --- Category-label band height: single line-height (from the theme font)
  // padded, floored at 24 (openui's `max(measured + 8, 24)`). ---
  const labelHeight = useMemo(
    () => Math.max(Math.ceil(parseLineHeight(context.font)) + 8, 24),
    [context],
  );

  // --- Dimensions (shell measurement → chart / body sizes) ---
  const effectiveHeight = containerHeight || (typeof height === "number" ? height : 0);
  const totalHeight = effectiveHeight || DEFAULT_CHART_HEIGHT;
  const legendDeduction = showLegend && shouldFitLegend ? legendHeight : 0;
  const chartHeight = Math.max(0, totalHeight - legendDeduction);
  const chartWidth = containerWidth || 0;
  const bodyHeight = Math.max(0, chartHeight - X_AXIS_HEIGHT);

  // --- Value scale: zero-anchored domain (0 always inside), niced, mapped to
  // the drawable width. One scale drives the bars, the grid, and the bottom
  // axis (pixel-exact vs openui's two-chart hack). ---
  const rightEdge = Math.max(AXIS_PAD, chartWidth - AXIS_PAD);
  const [domainMin, domainMax] = useMemo(
    () => valueDomain(data, dataKeys, variant),
    [data, dataKeys, variant],
  );
  const valueScale: ScaleLinear<number, number> = useMemo(
    () => scaleLinear().domain([domainMin, domainMax]).nice().range([AXIS_PAD, rightEdge]),
    [domainMin, domainMax, rightEdge],
  );
  const ticks = useMemo(() => {
    const tickCount = Math.max(2, Math.floor(chartWidth / TICK_MIN_SPACING));
    return valueScale.ticks(tickCount);
  }, [valueScale, chartWidth]);

  // --- Per-row layout (all delegated to the geometry module) ---
  const rowCount = data.length;
  const seriesCount = dataKeys.length;
  const groupHeight = useMemo(
    () => computeGroupHeight(seriesCount, variant, labelHeight),
    [seriesCount, variant, labelHeight],
  );
  const contentHeight = useMemo(
    () => computeContentHeight(rowCount, groupHeight),
    [rowCount, groupHeight],
  );
  const pad = useMemo(
    () => verticalPadding(contentHeight, bodyHeight),
    [contentHeight, bodyHeight],
  );
  const rowOffsets = useMemo(
    () => computeRowOffsets(rowCount, groupHeight, pad.top),
    [rowCount, groupHeight, pad.top],
  );
  const snapPositions = useMemo(
    () => computeSnapPositions(rowCount, groupHeight),
    [rowCount, groupHeight],
  );
  const svgHeight = pad.top + contentHeight + pad.bottom;
  const needsScroll = contentHeight > bodyHeight;

  // Stable React keys per row (LLMs re-emit duplicate categories).
  const rowKeys = useMemo(
    () => buildColumnKeys(data.map((row) => String(row[catKey]))),
    [data, catKey],
  );

  // --- Bars per row: grouped → one bar per visible series offset down the
  // group; stacked → sign-diverging segments laid from the zero line. ---
  const rows: HorizontalBarRow[] = useMemo(() => {
    const zeroX = valueScale(0);
    return data.map((row, i) => {
      const rowTop = rowOffsets[i] ?? 0;
      const barsTop = rowTop + labelHeight;
      const bars: HorizontalBar[] = [];

      if (variant === "stacked") {
        const { positives, negatives } = stackSegments(row, dataKeys);
        // Positives stack rightward from 0; negatives stack leftward from 0.
        let cumulative = 0;
        for (const seg of positives) {
          const start = valueScale(cumulative);
          cumulative += seg.value;
          const end = valueScale(cumulative);
          const width = Math.abs(end - start);
          bars.push({
            key: seg.key,
            seriesKey: seg.key,
            x: Math.min(start, end),
            y: barsTop,
            width,
            height: BAR_HEIGHT,
            color: colorMap[seg.key] ?? "#000000",
            radii: radiusArray("stacked", barRadius, seg.isFirst, seg.isLast, false),
            isNegative: false,
            showLine: showInternalLine(width),
            value: seg.value,
          });
        }
        cumulative = 0;
        for (const seg of negatives) {
          const start = valueScale(cumulative);
          cumulative += seg.value;
          const end = valueScale(cumulative);
          const width = Math.abs(end - start);
          bars.push({
            key: seg.key,
            seriesKey: seg.key,
            x: Math.min(start, end),
            y: barsTop,
            width,
            height: BAR_HEIGHT,
            color: colorMap[seg.key] ?? "#000000",
            radii: radiusArray("stacked", barRadius, seg.isFirst, seg.isLast, true),
            isNegative: true,
            showLine: showInternalLine(width),
            value: seg.value,
          });
        }
      } else {
        dataKeys.forEach((key, j) => {
          const value = barValue(row[key]);
          const valueX = valueScale(value);
          const width = Math.abs(valueX - zeroX);
          const isNegative = value < 0;
          bars.push({
            key,
            seriesKey: key,
            x: Math.min(zeroX, valueX),
            y: barsTop + j * (BAR_HEIGHT + BAR_GAP),
            width,
            height: BAR_HEIGHT,
            color: colorMap[key] ?? "#000000",
            radii: radiusArray("grouped", barRadius, false, false, isNegative),
            isNegative,
            showLine: showInternalLine(width),
            value,
          });
        });
      }

      return {
        key: rowKeys[i] ?? String(row[catKey]),
        category: String(row[catKey]),
        rowTop,
        groupHeight,
        bars,
      };
    });
  }, [
    data,
    catKey,
    dataKeys,
    variant,
    valueScale,
    rowOffsets,
    labelHeight,
    groupHeight,
    colorMap,
    barRadius,
    rowKeys,
  ]);

  // --- Hover: hit-test the pointer's SVG-local y against the row offsets
  // (whole group — label band + bars — highlights the category). ---
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      const [, my] = pointer(event.nativeEvent, event.currentTarget);
      let found: number | null = null;
      for (let i = 0; i < rowOffsets.length; i++) {
        const top = rowOffsets[i] ?? 0;
        if (my >= top && my < top + groupHeight) {
          found = i;
          break;
        }
      }
      setHoveredIndex(found);
      setMousePos({ x: event.clientX, y: event.clientY });
    },
    [rowOffsets, groupHeight],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
    setMousePos(null);
  }, []);

  const hoveredCategory = hoveredIndex !== null ? (rows[hoveredIndex]?.category ?? null) : null;

  // --- Tooltip: category label + one row per visible series ---
  const tooltipPayload = useMemo(() => {
    if (hoveredIndex === null) return null;
    const row = data[hoveredIndex];
    if (!row) return null;
    const items: TooltipItem[] = dataKeys.map((key) => ({
      name: key,
      value: barValue(row[key]),
      color: colorMap[key] ?? "#000000",
    }));
    return { label: String(row[catKey]), items };
  }, [hoveredIndex, data, dataKeys, colorMap, catKey]);

  // --- Vertical snap-scroll (mirrors useChartScroll's boundary math on the Y
  // axis). Buttons render only when the content overflows the body. ---
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(needsScroll);

  useEffect(() => {
    if (!needsScroll) {
      setCanScrollUp(false);
      setCanScrollDown(false);
      return;
    }
    const el = scrollBodyRef.current;
    if (el) {
      setCanScrollUp(el.scrollTop > 0);
      setCanScrollDown(el.scrollTop < el.scrollHeight - el.clientHeight - 1);
    } else {
      setCanScrollDown(true);
    }
  }, [needsScroll, scrollBodyRef, contentHeight, bodyHeight]);

  const onScroll = useCallback(() => {
    const el = scrollBodyRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 0);
    setCanScrollDown(el.scrollTop < el.scrollHeight - el.clientHeight - 1);
  }, [scrollBodyRef]);

  const onScrollUp = useCallback(() => {
    const el = scrollBodyRef.current;
    if (!el) return;
    const idx = nearestSnap(snapPositions, el.scrollTop, "up");
    el.scrollTo({ top: snapPositions[idx] ?? 0, behavior: "smooth" });
  }, [scrollBodyRef, snapPositions]);

  const onScrollDown = useCallback(() => {
    const el = scrollBodyRef.current;
    if (!el) return;
    const idx = nearestSnap(snapPositions, el.scrollTop, "down");
    el.scrollTo({ top: snapPositions[idx] ?? 0, behavior: "smooth" });
  }, [scrollBodyRef, snapPositions]);

  const containerStyle = useMemo(() => buildContainerStyle({}, width, height), [width, height]);

  return {
    isEmpty,
    isPrinting,
    legendRef,
    containerStyle,

    dataKeys,
    colors,
    legendItems,
    labelHeight,

    valueScale,
    ticks,
    formatTick: numberTickFormatter,

    rows,
    rowOffsets,
    groupHeight,
    snapPositions,
    contentHeight,
    svgHeight,
    topPad: pad.top,
    bodyHeight,
    chartWidth,
    chartHeight,

    hover: {
      hoveredIndex,
      hoveredCategory,
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
    tooltip: { payload: tooltipPayload, position: mousePos },
    legend: {
      hiddenSeries,
      toggleSeries,
      isLegendExpanded,
      setIsLegendExpanded,
    },
    scroll: {
      canUp: canScrollUp,
      canDown: canScrollDown,
      needsScroll,
      onScrollUp,
      onScrollDown,
      onScroll,
    },
  };
}
