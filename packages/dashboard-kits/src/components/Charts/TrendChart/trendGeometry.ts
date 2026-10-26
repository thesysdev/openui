// Trend-specific geometry: the morph layout (points plus the reference
// guides), the shaded difference between two curves, and end-label layout.
// The line and area generators live in shared/seriesGeometry.ts.
//
// Pure (no DOM, no React) — unit-tested directly.

import type { CurveFactory } from "d3-shape";
import { areaD } from "../shared/seriesGeometry";

/** Reference guides that ride the morph with the lines: [target, band from, band to]. */
export const GUIDE_COUNT = 3;

/**
 * The trend's morph vector: x per point, y per point for each series, then the
 * guides' y positions — `[x…, y(s0)…, y(s1)…, …, target, bandFrom, bandTo]`.
 * Guides ride the same morph as the lines, so a goal line glides with the data
 * when the scale changes instead of jumping ahead of it. Each series takes
 * exactly one slot per point: extra values are dropped and missing ones are
 * NaN, a gap the line generators break at.
 */
export function packTrend(
  xs: ArrayLike<number>,
  ys: ArrayLike<number>[],
  guides: [number, number, number],
): Float64Array {
  const n = xs.length;
  const out = new Float64Array(n * (ys.length + 1) + GUIDE_COUNT);
  out.set(xs, 0);
  ys.forEach((series, s) => {
    for (let j = 0; j < n; j++) out[n * (s + 1) + j] = j < series.length ? series[j]! : Number.NaN;
  });
  out.set(guides, n * (ys.length + 1));
  return out;
}

export function unpackTrend(values: Float64Array, pointCount: number, seriesCount: number) {
  const n = pointCount;
  return {
    xs: values.subarray(0, n),
    ys: Array.from({ length: seriesCount }, (_, s) => values.subarray(n * (s + 1), n * (s + 2))),
    guides: values.subarray(n * (seriesCount + 1), n * (seriesCount + 1) + GUIDE_COUNT),
  };
}

/**
 * The shaded difference between a primary curve and a comparison curve, the
 * way Observable Plot's difference mark draws it: one band between the two
 * curves, shown twice through two clips — the region above the comparison
 * (where the primary is ahead, a larger value) and the region below it. The
 * shading follows both curves exactly, crossings included, with no polygon
 * approximation.
 */
export function differencePaths(
  xs: ArrayLike<number>,
  primary: ArrayLike<number>,
  comparison: ArrayLike<number>,
  top: number,
  bottom: number,
  curve: CurveFactory,
): { band: string; aboveComparison: string; belowComparison: string } {
  return {
    band: areaD(xs, comparison, primary, curve),
    aboveComparison: areaD(xs, top, comparison, curve),
    belowComparison: areaD(xs, bottom, comparison, curve),
  };
}

/**
 * End-label y positions nudged apart so no two overlap, then shifted back up
 * if the stack runs past the bottom of the plot.
 */
export function spreadLabels(
  items: { key: string; y: number }[],
  top: number,
  bottom: number,
  gap = 15,
): Map<string, number> {
  const sorted = items.map((item) => ({ ...item })).sort((a, b) => a.y - b.y);
  sorted.forEach((item, i) => {
    if (i > 0) item.y = Math.max(item.y, sorted[i - 1]!.y + gap);
  });
  const overflow = sorted.length ? sorted[sorted.length - 1]!.y - bottom : 0;
  if (overflow > 0) sorted.forEach((item) => (item.y = Math.max(top, item.y - overflow)));
  return new Map(sorted.map((item) => [item.key, item.y]));
}

/** An event label to place: where it starts, its text, and the row it would like. */
export interface EventLabelInput {
  x: number;
  text: string;
  /** Rows below this are taken by span labels; markers start at their own row. */
  minRow: number;
  /** Right-aligned at x (a marker near the right edge), instead of starting there. */
  end?: boolean;
}

/**
 * Rows for event labels: each takes the first row from its minimum where it
 * clears the labels already there and stays between `left` and `right`; one
 * that fits nowhere within `rows` gets no label (the shading and the tooltip
 * still show the event). About 6.4px a character at the label's 11px weight.
 */
export function placeEventLabels(
  items: EventLabelInput[],
  left: number,
  right: number,
  rows = 3,
  charWidth = 6.4,
): (number | undefined)[] {
  const taken: [number, number][][] = Array.from({ length: rows + 1 }, () => []);
  return items.map((item) => {
    const width = item.text.length * charWidth;
    const from = item.end ? item.x - width : item.x;
    const to = from + width;
    if (from < left - 2 || to > right + 2) return undefined;
    for (let row = item.minRow; row <= rows; row++) {
      const clear = taken[row]!.every(([a, b]) => to + 8 <= a || from >= b + 8);
      if (clear) {
        taken[row]!.push([from, to]);
        return row;
      }
    }
    return undefined;
  });
}
