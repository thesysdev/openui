import { type CSSProperties, useMemo, useRef, useState } from "react";

import type { ChartColorPalette } from "../../../ThemeProvider";
import { useTheme } from "../../../ThemeProvider";
import {
  buildCalendarGrid,
  type CalendarCell,
  type CalendarRange,
  formatCalendarTooltipDate,
  monthLabelColumns,
} from "../../CalendarHeatmap/parts/calendarMath";
import { contributionLevel } from "../../CalendarHeatmap/parts/levelScale";
import {
  resolveCalendarSeparators,
  type ResolvedCalendarSeparators,
} from "../../CalendarHeatmap/parts/separatorLayout";
import type { CalendarColumnSeparators, CalendarLevelStyle } from "../../CalendarHeatmap/types";
import { buildContainerStyle } from "../../utils/buildContainerStyle";
import { CHART_CLASS_PREFIX, DEFAULT_CHART_HEIGHT } from "../../utils/constants";
import { parseLineHeight } from "../../utils/labelWrap";
import { resolvePalette } from "../../utils/paletteUtils";
import { sampleRampStops } from "../../utils/rampUtils";
import { useCanvasContextForLabelSize } from "../core/useCanvasContextForLabelSize";
import { useChartShell } from "../core/useChartShell";
import { usePerElementHover } from "../core/usePerElementHover";

// Level-scale size — GitHub's 5 contribution buckets (empty + four intensities).
const LEVEL_COUNT = 5;
// Never let a measuring/streaming frame collapse a cell to 0/negative px.
const MIN_CELL = 2;
const ROW_COUNT = 7;
// Gap between the weekday labels and the grid; also the breathing room on the
// label's far side (so the reserved gutter is `label + 2·gap`).
const WEEKDAY_LABEL_GAP = 6;
// Minimum weekday gutter — holds space through the SSR/hydration frame where the
// canvas measurer reports zero-width text.
const WEEKDAY_GUTTER_MIN = 24;
// Gap between the month labels and the top of the grid.
const MONTH_LABEL_BOTTOM_GAP = 4;
// Right padding after the last week column (0 = grid fills the width).
const GUTTER_RIGHT = 0;

// A local Sunday (getDay() === 0) to name weekday rows off a fixed reference
// week — no dependency on today's weekday.
const WEEKDAY_REFERENCE_SUNDAY = new Date(1970, 0, 4);
const WEEKDAY_SHORT_FMT = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const WEEKDAY_INITIAL_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "narrow",
});

/** The weekday name for grid row `row` under `weekStartDay`. */
function weekdayLabel(weekStartDay: number, row: number, format: "full" | "initial"): string {
  const date = new Date(WEEKDAY_REFERENCE_SUNDAY);
  date.setDate(date.getDate() + ((weekStartDay + row) % ROW_COUNT));
  return (format === "initial" ? WEEKDAY_INITIAL_FMT : WEEKDAY_SHORT_FMT).format(date);
}

/** The rows that get a left-hand weekday label, with their formatted text. */
function buildWeekdayTicks(
  weekStartDay: number,
  filter: "all" | "odd" | "even",
  format: "full" | "initial",
): Array<{ row: number; label: string }> {
  const ticks: Array<{ row: number; label: string }> = [];
  for (let row = 0; row < ROW_COUNT; row++) {
    if (filter === "odd" && row % 2 === 0) continue;
    if (filter === "even" && row % 2 === 1) continue;
    ticks.push({ row, label: weekdayLabel(weekStartDay, row, format) });
  }
  return ticks;
}

/** A grid cell tagged with its resolved contribution level 0..4. */
export interface CalendarLeveledCell extends CalendarCell {
  level: 0 | 1 | 2 | 3 | 4;
}

export interface UseCalendarHeatmapOrchestratorParams {
  data: ReadonlyArray<{ date: string | Date; value: number }>;
  themePaletteName: keyof ChartColorPalette;
  customPalette?: string[];
  levelColors?: [string, string, string, string, string];
  levelStyles?: Array<CalendarLevelStyle | null>;
  thresholds?: [number, number, number, number];
  range?: CalendarRange;
  layout: "fluid" | "fill";
  binSize?: number;
  gap: number;
  weekStartDay: number;
  hideGhostCells: boolean;
  weekdayTickFilter: "all" | "odd" | "even";
  weekdayLabelFormat: "full" | "initial";
  showMonthLabels: boolean;
  columnSeparators?: CalendarColumnSeparators;
  showLegend: boolean;
  formatTooltipLabel?: (value: number, date: Date) => string;
  width?: number | string;
  height?: number | string;
}

/** Normalize the sparse `levelStyles` prop to a fixed length-5 array. */
function normalizeLevelStyles(
  levelStyles: Array<CalendarLevelStyle | null> | undefined,
): Array<CalendarLevelStyle | null> {
  return Array.from({ length: LEVEL_COUNT }, (_, level) => levelStyles?.[level] ?? null);
}

/**
 * Orchestrator for the CalendarHeatmap: a 7-row week-column grid where the VALUE
 * axis is a discrete 0..4 contribution level (GitHub-contributions style).
 * Follows the funnel/heatmap standalone fit-only shape — the calendar-grid math
 * comes from the pure `parts/` modules, the level ramp is five stops sampled
 * from `resolvePalette` (the low→high ordering HeatmapChart's quantize ramp
 * uses), and hover is per-cell (each cell owns its mouse handlers; mouse-only,
 * like heatmap/funnel).
 */
export function useCalendarHeatmapOrchestrator({
  data,
  themePaletteName,
  customPalette,
  levelColors: levelColorsProp,
  levelStyles: levelStylesProp,
  thresholds,
  range,
  layout,
  binSize,
  gap,
  weekStartDay,
  hideGhostCells,
  weekdayTickFilter,
  weekdayLabelFormat,
  showMonthLabels,
  columnSeparators,
  showLegend,
  formatTooltipLabel,
  width,
  height,
}: UseCalendarHeatmapOrchestratorParams) {
  const containerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const {
    hovered: hoveredCell,
    mousePos,
    handleMouseMove: handleCellMouseMove,
    handleMouseLeave,
  } = usePerElementHover<CalendarLeveledCell>();
  // Legend-driven level highlight; combined below with the hovered cell's level
  // so the link runs both ways (bklit parity).
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);

  const { isPrinting, containerWidth, containerHeight, isEmpty, legendHeight } = useChartShell({
    data,
    showLegend,
    containerRef,
    legendRef,
    width,
    height,
  });
  const context = useCanvasContextForLabelSize();
  const { theme } = useTheme();

  const levelStyles = useMemo(() => normalizeLevelStyles(levelStylesProp), [levelStylesProp]);

  // --- Level colors: five stops, either explicit or sampled from the ramp. The
  // sampled ramp keeps HeatmapChart's low→high ordering, so stop 0 is the faint
  // "empty" shade and stop 4 the most active. A per-level `levelStyles[i].color`
  // then supersedes the resolved stop. ---
  const levelColors = useMemo<string[]>(() => {
    const base = levelColorsProp
      ? [...levelColorsProp]
      : sampleRampStops(resolvePalette(theme, themePaletteName, customPalette), LEVEL_COUNT);
    return base.map((color, level) => levelStyles[level]?.color ?? color);
  }, [levelColorsProp, theme, themePaletteName, customPalette, levelStyles]);

  // --- Grid + per-cell level ---
  const grid = useMemo(
    () => buildCalendarGrid(data, { range, weekStartDay, hideGhostCells }),
    [data, range, weekStartDay, hideGhostCells],
  );

  const cells = useMemo<CalendarLeveledCell[]>(
    () =>
      grid.cells.map((cell) => ({
        ...cell,
        level: contributionLevel(cell.value, thresholds),
      })),
    [grid, thresholds],
  );

  // --- Axis annotations ---
  const monthLabels = useMemo(
    () => (showMonthLabels ? monthLabelColumns(grid) : []),
    [showMonthLabels, grid],
  );
  const weekdayTicks = useMemo(
    () => buildWeekdayTicks(weekStartDay, weekdayTickFilter, weekdayLabelFormat),
    [weekStartDay, weekdayTickFilter, weekdayLabelFormat],
  );

  // --- Column separators: resolve the config into rule columns, per-column
  // gutter offsets, and (quarter mode) labels. Absent → no rules, zero offsets. ---
  const separators = useMemo<ResolvedCalendarSeparators>(
    () =>
      columnSeparators
        ? resolveCalendarSeparators(grid, columnSeparators)
        : { columns: [], offsets: [], spacing: 0, labels: [] },
    [columnSeparators, grid],
  );
  const totalGutter = separators.columns.length * separators.spacing;

  // --- Reserved gutters (measured, like the heatmap's y-axis width) ---
  const gutterLeft = useMemo(() => {
    let max = 0;
    for (const tick of weekdayTicks) {
      max = Math.max(max, context.measureText(tick.label).width);
    }
    return Math.max(WEEKDAY_GUTTER_MIN, Math.ceil(max) + WEEKDAY_LABEL_GAP * 2);
  }, [weekdayTicks, context]);

  const gutterTop = showMonthLabels
    ? Math.ceil(parseLineHeight(context.font)) + MONTH_LABEL_BOTTOM_GAP
    : 0;

  // --- Cell geometry ---
  const weeks = grid.weeks;
  // Separator gutters are carved out of the available width (auto-size modes) so
  // the grid + rules still fit the container; a fixed binSize instead lets the
  // plot grow by the gutters.
  const innerWidth = Math.max(0, (containerWidth || 0) - gutterLeft - GUTTER_RIGHT - totalGutter);
  const effectiveHeight = containerHeight || (typeof height === "number" ? height : 0);
  const totalHeight = effectiveHeight || DEFAULT_CHART_HEIGHT;

  let pitchX: number;
  let pitchY: number;
  if (binSize && binSize > 0) {
    pitchX = binSize;
    pitchY = binSize;
  } else if (layout === "fill") {
    const availableHeight = Math.max(0, totalHeight - gutterTop - legendHeight);
    pitchX = innerWidth / weeks;
    pitchY = availableHeight / ROW_COUNT;
  } else {
    // fluid — square cells sized from the width; height hugs the seven rows.
    const cell = innerWidth / weeks;
    pitchX = cell;
    pitchY = cell;
  }
  // Clamp so a zero/negative measuring frame can never emit NaN or sub-2px cells.
  pitchX = Math.max(pitchX, gap + MIN_CELL);
  pitchY = Math.max(pitchY, gap + MIN_CELL);
  const cellW = pitchX - gap;
  const cellH = pitchY - gap;

  const plotWidth = weeks * pitchX + totalGutter;
  const plotHeight = ROW_COUNT * pitchY;
  const svgWidth = gutterLeft + plotWidth + GUTTER_RIGHT;
  const svgHeight = gutterTop + plotHeight;

  // --- Tooltip (mouse-only, per-cell). The header is the ordinal-date line; the
  // single item is the day's contribution total, `formatTooltipLabel`-formatted
  // when provided. ---
  const tooltipPayload = useMemo(() => {
    if (!hoveredCell) return null;
    return {
      label: formatCalendarTooltipDate(hoveredCell.date),
      items: [
        {
          name: "contributions",
          value: formatTooltipLabel
            ? formatTooltipLabel(hoveredCell.value, hoveredCell.date)
            : hoveredCell.value,
          color: levelColors[hoveredCell.level] ?? levelColors[0] ?? "#000000",
        },
      ],
    };
  }, [hoveredCell, levelColors, formatTooltipLabel]);

  // --- Bidirectional level highlight, in two scopes (bklit parity):
  // `hoveredLevel` (legend hover only) drives the GRID dim — hovering a cell
  // must never re-shade the grid. The combined `highlightedLevel` (legend hover,
  // else the hovered cell's level) drives the LEGEND swatch highlight, so a
  // hovered cell still lights up its swatch. ---
  const highlightedLevel = hoveredLevel ?? hoveredCell?.level ?? null;

  // --- Container style: the five level colors as CSS vars so a later task's
  // per-level styles can override a level's fill without touching the painter,
  // plus any fixed width/height. ---
  const containerStyle = useMemo<CSSProperties>(() => {
    const vars: Record<string, string> = {};
    for (let level = 0; level < LEVEL_COUNT; level++) {
      vars[`--${CHART_CLASS_PREFIX}-calendar-heatmap-level-${level}`] =
        levelColors[level] ?? "#000000";
    }
    return {
      ...buildContainerStyle({}, width, height),
      ...vars,
    } as CSSProperties;
  }, [levelColors, width, height]);

  return {
    refs: { containerRef, legendRef },
    isPrinting,
    isEmpty,
    cells,
    levelColors,
    levelStyles,
    monthLabels,
    weekdayTicks,
    separators,
    dimensions: {
      containerWidth,
      svgWidth,
      svgHeight,
      gutterLeft,
      gutterTop,
      pitchX,
      pitchY,
      cellW,
      cellH,
      gap,
      plotHeight,
      monthLabelY: gutterTop - MONTH_LABEL_BOTTOM_GAP,
      weekdayLabelX: gutterLeft - WEEKDAY_LABEL_GAP,
    },
    hover: {
      hoveredCell,
      mousePos,
      handleCellMouseMove,
      handleMouseLeave,
      hoveredLevel,
      highlightedLevel,
      setHoveredLevel,
    },
    tooltip: { tooltipPayload },
    style: { containerStyle },
  };
}
