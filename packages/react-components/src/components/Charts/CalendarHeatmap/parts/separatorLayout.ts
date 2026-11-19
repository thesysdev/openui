// Column separator + gutter math for the CalendarHeatmap. Pure; no React/DOM/d3.
//
// Ported from bklit's separator layout (getHeatmapSeparatorColumnIndices,
// getHeatmapColumnXOffset) — logic, not code. Separators split the week columns
// into groups (a fixed interval or calendar quarters); each separator opens a
// `spacing`-wide gutter, so columns to its right shift by that much.

import { type CalendarGrid, quarterBoundaryColumns } from "./calendarMath";

export interface SeparatorConfig {
  /** Fixed interval (`{ every: N }`) or calendar-quarter boundaries. */
  groupBy: { every: number } | "quarter";
  /** Gutter width opened at each separator, in px (consumed by columnXOffsets). */
  spacing?: number;
  /** Emit calendar-quarter labels (only meaningful for `groupBy: 'quarter'`). */
  showLabels?: boolean;
}

/** A quarter label anchored to the column that opens its group. */
export interface CalendarSeparatorLabel {
  /** Column the group opens at (`0` for the leading group). */
  col: number;
  /** Calendar quarter `1`–`4`. */
  quarter: number;
  /** Calendar year the quarter belongs to. */
  year: number;
}

/** Everything the renderer needs to draw separators + shift the cell grid. */
export interface ResolvedCalendarSeparators {
  /** Columns a vertical separator is drawn at (see {@link separatorColumns}). */
  columns: number[];
  /** Per-column x-offset in px (see {@link columnXOffsets}); length `grid.weeks`. */
  offsets: number[];
  /** Resolved gutter width (defaults to 0). */
  spacing: number;
  /** Quarter labels, or `[]` when labels are off / not quarter mode. */
  labels: CalendarSeparatorLabel[];
}

/**
 * Column indices where a vertical separator is drawn.
 *
 * `'quarter'` delegates to the grid's calendar-quarter boundaries. `{ every: N }`
 * places a separator before every Nth column (`N, 2N, …`), never at column 0 and
 * never at/after the last column; a non-positive `N` or one that meets/exceeds
 * the grid width yields none.
 */
export function separatorColumns(grid: CalendarGrid, cfg: SeparatorConfig): number[] {
  if (cfg.groupBy === "quarter") {
    return quarterBoundaryColumns(grid);
  }

  const { every } = cfg.groupBy;
  if (every <= 0 || grid.weeks <= every) return [];

  const columns: number[] = [];
  for (let col = every; col < grid.weeks; col += every) {
    columns.push(col);
  }
  return columns;
}

/**
 * Per-column extra x-offset (px). Each column is shifted right by `spacing` for
 * every separator at or before it, so the gutters accumulate left→right.
 * Returns one offset per column, length `weeks`.
 */
export function columnXOffsets(weeks: number, separatorCols: number[], spacing: number): number[] {
  const sorted = [...separatorCols].sort((a, b) => a - b);
  const offsets: number[] = [];
  for (let col = 0; col < weeks; col++) {
    let crossed = 0;
    for (const separator of sorted) {
      if (separator <= col) crossed++;
      else break;
    }
    offsets.push(crossed * spacing);
  }
  return offsets;
}

/**
 * Quarter labels for a `'quarter'`-grouped grid. The leading group opens at
 * column 0; each boundary column opens the next group. Because every in-window
 * quarter start is a boundary, the groups are consecutive quarters — so labels
 * advance one quarter per group from the leading group's quarter (the quarter
 * containing the last day of column 0), rolling the year on the Q4→Q1 wrap.
 */
function quarterLabels(grid: CalendarGrid, boundaryCols: number[]): CalendarSeparatorLabel[] {
  // The last day of column 0 (week-aligned start + 6 days); its quarter anchors
  // the leading group even when the aligned start spills into the prior quarter.
  const col0End = new Date(grid.start);
  col0End.setDate(col0End.getDate() + 6);
  const firstQuarter = Math.floor(col0End.getMonth() / 3) + 1; // 1..4
  const firstYear = col0End.getFullYear();

  const groupCols = [0, ...boundaryCols];
  return groupCols.map((col, index) => {
    // 0-based quarter count from `firstYear` Q1, advanced one per group.
    const quarterOrdinal = firstQuarter - 1 + index;
    return {
      col,
      quarter: (quarterOrdinal % 4) + 1,
      year: firstYear + Math.floor(quarterOrdinal / 4),
    };
  });
}

/**
 * Resolves a {@link SeparatorConfig} against the grid into the drawing inputs:
 * the separator columns, the per-column gutter offsets, the resolved spacing,
 * and (quarter mode + `showLabels` only) the quarter labels. `spacing` defaults
 * to 0, matching a hairline separator that does not shift the grid.
 */
export function resolveCalendarSeparators(
  grid: CalendarGrid,
  cfg: SeparatorConfig,
): ResolvedCalendarSeparators {
  const spacing = cfg.spacing ?? 0;
  const columns = separatorColumns(grid, cfg);
  const offsets = columnXOffsets(grid.weeks, columns, spacing);
  const labels = cfg.showLabels && cfg.groupBy === "quarter" ? quarterLabels(grid, columns) : [];
  return { columns, offsets, spacing, labels };
}
