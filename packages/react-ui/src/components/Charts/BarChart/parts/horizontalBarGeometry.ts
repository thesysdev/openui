// Pure layout geometry for the horizontal BarChart: the load-bearing math that
// turns a category/series count into per-row heights, the scrolling content
// height, its vertical centering pad, the cumulative row offsets, the
// snap-scroll positions, and the value/bar math — value coercion, the
// zero-anchored value domain, the sign-diverging stack split, per-corner bar
// radii, and the internal-line threshold. Kept out of the React layer so every
// value is unit-testable in isolation (node env, no DOM). The orientation-
// neutral rounded-rect SVG path lives in `../../shared/cartesian/roundedBarPath`.
//
// Ported from openui's HorizontalBarChart constants + getRadiusArray corner
// logic (the `orientation:"horizontal"` branches).

import type { ChartData } from "../../types";

/** One bar's cross-axis thickness (px). */
export const BAR_HEIGHT = 16;
/** Gap between grouped bars within a single category (px). */
export const BAR_GAP = 10;
/** Padding added below each category group, between the label and the next
 *  row (px). openui's BAR_CATEGORY_GAP. */
export const GROUP_PADDING = 16;
/** Floor for a lone category's content height so a single row still fills a
 *  sensible amount of the body (px). */
export const SINGLE_ROW_MIN = 80;

/** Fixed height (px) of the bottom value-axis band. The scroll body's height is
 *  `chartHeight - X_AXIS_HEIGHT`, and the fixed axis svg is drawn at exactly
 *  this height, so keeping ONE constant keeps the two in lock-step (drift would
 *  desync the axis svg vs the body sizing). openui's X_AXIS_HEIGHT. */
export const X_AXIS_HEIGHT = 40;

/** Corner radius for a bar's rounded (outer) end (px). openui BAR_RADIUS. */
export const BAR_RADIUS = 4;
/** A bar's extent (width) must reach this before its internal decorative line
 *  is drawn (px). Below it the line is hidden. openui MIN_LINE_DIMENSION. */
export const MIN_LINE_DIMENSION = 8;
/** Inset from each end of the bar to the internal line's endpoints (px).
 *  Consumed by the React layer when it lays out the internal line. openui
 *  LINE_PADDING. */
export const LINE_PADDING = 6;

type BarChartVariant = "grouped" | "stacked";

/**
 * Height of one category group: its label plus the bar stack plus the trailing
 * group padding.
 * - grouped: every series gets its own `BAR_HEIGHT` bar separated by `BAR_GAP`
 *   (n bars → n-1 gaps), so `n*(BAR_HEIGHT+BAR_GAP) - BAR_GAP`.
 * - stacked: all series share a single `BAR_HEIGHT` bar, so `seriesCount` is
 *   irrelevant.
 * `labelHeight` is the measured category-label height (caller measures it).
 */
export function groupHeight(
  seriesCount: number,
  variant: BarChartVariant,
  labelHeight: number,
): number {
  const barsHeight =
    variant === "stacked" ? BAR_HEIGHT : seriesCount * (BAR_HEIGHT + BAR_GAP) - BAR_GAP;
  return barsHeight + labelHeight + GROUP_PADDING;
}

/**
 * Total scrollable content height for `rowCount` categories. Empty → 0. A lone
 * category is floored at `SINGLE_ROW_MIN` so a single row doesn't collapse to a
 * sliver.
 */
export function contentHeight(rowCount: number, groupHeight: number): number {
  if (rowCount === 0) return 0;
  const total = rowCount * groupHeight;
  if (rowCount === 1) return Math.max(total, SINGLE_ROW_MIN);
  return total;
}

/**
 * Vertical pad that centers the content within the scroll body. When the
 * content overflows the body (`paddingValue < 0`) fall back to a fixed
 * `{top:10, bottom:10}` inset so the first/last rows aren't flush to the edges;
 * otherwise split the slack evenly top and bottom.
 */
export function verticalPadding(
  contentHeight: number,
  bodyHeight: number,
): { top: number; bottom: number } {
  const paddingValue = bodyHeight - contentHeight;
  if (paddingValue < 0) return { top: 10, bottom: 10 };
  return { top: paddingValue / 2, bottom: paddingValue / 2 };
}

/**
 * Cumulative y (top) of each category row: `topPad + i*groupHeight`. Empty → [].
 */
export function rowOffsets(rowCount: number, groupHeight: number, topPad: number): number[] {
  return Array.from({ length: rowCount }, (_, i) => topPad + i * groupHeight);
}

/**
 * Snap-scroll targets, one per category: `[0, g, 2g, …]`. Empty → `[0]` so the
 * caller always has a valid target to scroll to.
 */
export function snapPositions(rowCount: number, groupHeight: number): number[] {
  if (rowCount === 0) return [0];
  return Array.from({ length: rowCount }, (_, i) => i * groupHeight);
}

/**
 * Index of the snap to scroll to. Finds the highest snap at or before `current`
 * (the enclosing row), then steps one row in `dir`, clamped to the ends. The
 * caller scrolls to `positions[idx] ?? 0`.
 */
export function nearestSnap(positions: number[], current: number, dir: "up" | "down"): number {
  let idx = 0;
  for (let i = 0; i < positions.length; i++) {
    if (positions[i]! <= current) idx = i;
  }
  return dir === "up" ? Math.max(0, idx - 1) : Math.min(positions.length - 1, idx + 1);
}

/**
 * A single row value as a finite number. Anything non-numeric (`undefined`,
 * `null`, a non-numeric string, `NaN`, `±Infinity`) collapses to 0; the SIGN is
 * kept — unlike the SegmentedBar, negatives are meaningful here (they draw left
 * of the value-zero line), so we clamp only to finiteness, never to `>= 0`.
 */
export function barValue(raw: unknown): number {
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

/**
 * The value-axis domain, always anchored through zero (the bar origin), so 0 is
 * ALWAYS inside the returned range.
 * - grouped: the global `[min(0, minValue), max(0, maxValue)]` over every
 *   series value (each bar is independent).
 * - stacked: per-row signed sums — positives sum rightward, negatives sum
 *   leftward (d3 `stackOffsetDiverging`) — so the extent is
 *   `[min(0, lowest negative sum), max(0, highest positive sum)]`.
 *
 * Empty data → `[0, 0]` (matching `computeYDomain`). The caller applies
 * `.nice()`; this stays exact.
 */
export function valueDomain(
  data: ChartData,
  dataKeys: string[],
  variant: BarChartVariant,
): [number, number] {
  let min = 0;
  let max = 0;

  for (const row of data) {
    if (variant === "stacked") {
      let positiveSum = 0;
      let negativeSum = 0;
      for (const key of dataKeys) {
        const value = barValue(row[key]);
        if (value >= 0) positiveSum += value;
        else negativeSum += value;
      }
      if (positiveSum > max) max = positiveSum;
      if (negativeSum < min) min = negativeSum;
    } else {
      for (const key of dataKeys) {
        const value = barValue(row[key]);
        if (value > max) max = value;
        if (value < min) min = value;
      }
    }
  }

  return [min, max];
}

/** One classified segment of a stacked row. */
export interface StackSegment {
  /** The series key this segment renders. */
  key: string;
  /** The (finite, signed) value. */
  value: number;
  /** Negatives draw left of the zero line, positives right. */
  isNegative: boolean;
  /** Innermost segment of its sign group (adjacent to the zero line). */
  isFirst: boolean;
  /** Outermost segment of its sign group (its far end rounds). */
  isLast: boolean;
}

/**
 * Split a stacked row's values into its ordered positive and negative segments.
 * Series keep their `dataKeys` order within each sign group, so positives read
 * left→right from the zero line (index 0 innermost, growing rightward) and
 * negatives read right→left from it (index 0 innermost, growing leftward) — the
 * order d3's diverging stack lays them out. Zero-valued keys join the positive
 * group (openui `>= 0`), matching `getBarStackInfo`; they render zero-width so
 * their placement is immaterial. The first/last flags per group drive corner
 * rounding: only the OUTERMOST (`isLast`) segment rounds its far end.
 */
export function stackSegments(
  rowValues: ChartData[number],
  dataKeys: string[],
): { positives: StackSegment[]; negatives: StackSegment[] } {
  const positives: StackSegment[] = [];
  const negatives: StackSegment[] = [];

  for (const key of dataKeys) {
    const value = barValue(rowValues[key]);
    const isNegative = value < 0;
    const segment: StackSegment = {
      key,
      value,
      isNegative,
      isFirst: false,
      isLast: false,
    };
    if (isNegative) negatives.push(segment);
    else positives.push(segment);
  }

  for (const group of [positives, negatives]) {
    if (group.length > 0) {
      group[0]!.isFirst = true;
      group[group.length - 1]!.isLast = true;
    }
  }

  return { positives, negatives };
}

/**
 * Per-corner radii `[tl, tr, br, bl]` for one horizontal bar segment. The
 * horizontal slice of openui's `getRadiusArray`:
 * - grouped: positive rounds its right end `[0, r, r, 0]`, negative its left
 *   end `[r, 0, 0, r]` (each bar is independent).
 * - stacked: only the OUTERMOST segment of a sign group (`isLast`) rounds its
 *   far end; a single-segment stack (`isFirst && isLast`) rounds like a grouped
 *   bar; inner segments stay square `[0, 0, 0, 0]`.
 */
export function radiusArray(
  variant: BarChartVariant,
  radius: number,
  isFirst: boolean,
  isLast: boolean,
  isNegative: boolean,
): [number, number, number, number] {
  if (variant === "grouped") {
    return isNegative ? [radius, 0, 0, radius] : [0, radius, radius, 0];
  }

  // stacked
  // A lone segment rounds its outer end exactly like a grouped bar.
  if (isFirst && isLast) {
    return isNegative ? [radius, 0, 0, radius] : [0, radius, radius, 0];
  }
  // In a multi-segment stack only the outermost segment rounds its far end.
  if (isLast) {
    return isNegative ? [radius, 0, 0, radius] : [0, radius, radius, 0];
  }
  return [0, 0, 0, 0];
}

/**
 * Whether a bar is wide enough to carry its internal decorative line: openui
 * hides the line once the bar's extent drops below `MIN_LINE_DIMENSION` so it
 * doesn't crowd a sliver of a bar.
 */
export function showInternalLine(barWidth: number): boolean {
  return barWidth >= MIN_LINE_DIMENSION;
}
