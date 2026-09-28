// Pure geometry for the mini charts (MiniAreaChart / MiniLineChart /
// MiniBarChart) — the sizing rules of react-ui's Recharts mini charts, kept out
// of the React layer so they are unit-testable in node.

import { scaleLinear, scalePoint } from "d3-scale";
import { curveLinear, curveMonotoneX, curveStep } from "d3-shape";

export type MiniChartDatum = number | { value: number; label?: string };

export interface MiniChartPoint {
  value: number;
  label: string;
}

/** Numbers or `{ value, label? }` objects → `{ value, label }`, labels defaulting to "Item N". */
export const toMiniChartPoints = (data: readonly MiniChartDatum[]): MiniChartPoint[] =>
  data.map((item, index) =>
    typeof item === "number"
      ? { value: item, label: `Item ${index + 1}` }
      : { value: item.value, label: item.label || `Item ${index + 1}` },
  );

/** Area/line: one point every 20px. */
export const MINI_POINT_SPACING = 20;

/**
 * The most recent area/line points that fit `width`: n points span
 * (n - 1) gaps of MINI_POINT_SPACING. Everything when unmeasured (width 0).
 */
export const recentPointsThatFit = <T>(data: readonly T[], width: number): T[] => {
  if (width <= 0 || data.length === 0) return [...data];
  const maxItems = Math.floor((width + MINI_POINT_SPACING) / MINI_POINT_SPACING);
  return maxItems >= data.length ? [...data] : data.slice(-maxItems);
};

export const MINI_BAR_WIDTH = 8;
export const MINI_BAR_SPACING = 10;
/** Horizontal room the bar chart keeps free: its 4px side padding, both sides. */
const MINI_BAR_HORIZONTAL_PADDING = 8;

/** The most recent bars that fit `width` (8px bar + 10px gap each). */
export const recentBarsThatFit = <T>(data: readonly T[], width: number): T[] => {
  if (width <= 0 || data.length === 0) return [...data];
  const maxItems = Math.floor(
    (width - MINI_BAR_HORIZONTAL_PADDING) / (MINI_BAR_WIDTH + MINI_BAR_SPACING),
  );
  return maxItems >= data.length ? [...data] : data.slice(-Math.max(0, maxItems));
};

/** Empty room left of the bars: they sit right-aligned when they don't fill the width. */
export const miniBarsLeftPadding = (count: number, width: number): number =>
  Math.max(0, width - MINI_BAR_HORIZONTAL_PADDING - count * (MINI_BAR_WIDTH + MINI_BAR_SPACING));

// Recharts' default value axis ("auto" domain, 5 ticks) rounds its range with
// recharts-scale's getNiceTickValues: steps of 5% of the value's order of
// magnitude (10% below 10), widened until 5 ticks cover the data. It can end
// above d3's `.nice()` (max 50 → 0‥60 where d3 gives 0‥50), and on the
// axis-free minis that shows directly as mark height — so they use this.
const clean = (n: number) => Number(n.toPrecision(12));
const digitCount = (v: number) => (v === 0 ? 1 : Math.floor(Math.log10(Math.abs(v))) + 1);

const niceStep = (roughStep: number, correction: number): number => {
  if (roughStep <= 0) return 0;
  const digits = digitCount(roughStep);
  const unit = 10 ** digits;
  const ratioScale = digits !== 1 ? 0.05 : 0.1;
  return clean((Math.ceil(clean(roughStep / unit / ratioScale)) + correction) * ratioScale * unit);
};

/** The [min, max] range Recharts' default 5-tick value axis spans for this data range. */
export const rechartsNiceDomain = (
  min: number,
  max: number,
  tickCount = 5,
  correction = 0,
): [number, number] => {
  if (min === max) {
    // recharts-scale's single-value case: ticks around the value, step 1
    // (all-zero data spans 0‥4).
    const middle = min === 0 ? Math.floor((tickCount - 1) / 2) : Math.floor(min);
    const middleIndex = Math.floor((tickCount - 1) / 2);
    return [middle - middleIndex, middle + (tickCount - 1 - middleIndex)];
  }
  const step = niceStep((max - min) / (tickCount - 1), correction);
  if (step === 0) return [min, max];
  const middle = min <= 0 && max >= 0 ? 0 : clean((min + max) / 2 - (((min + max) / 2) % step));
  let below = Math.ceil(clean((middle - min) / step));
  let up = Math.ceil(clean((max - middle) / step));
  const count = below + up + 1;
  if (count > tickCount) return rechartsNiceDomain(min, max, tickCount, correction + 1);
  if (count < tickCount) {
    if (max > 0) up += tickCount - count;
    else below += tickCount - count;
  }
  return [clean(middle - below * step), clean(middle + up * step)];
};

/** Value domain, always anchored through zero. */
export const miniValueDomain = (values: readonly number[]): [number, number] => {
  let min = 0;
  let max = 0;
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return [min, max];
};

/**
 * Curves by `variant`, as Recharts draws its mini charts: "natural" is
 * monotone, "step" steps at the midpoint between points.
 */
export const miniCurves = {
  linear: curveLinear,
  natural: curveMonotoneX,
  step: curveStep,
} as const;

/** Room above the highest point on the area/line minis (Recharts' `margin.top`). */
export const MINI_TOP_MARGIN = 10;

/**
 * Area/line geometry: the most recent points that fit, spread edge to edge,
 * over a zero-anchored value range rounded as Recharts does, top margin 10px.
 */
export function miniLineGeometry(data: readonly MiniChartDatum[], width: number, height: number) {
  const points = toMiniChartPoints(recentPointsThatFit(data, width));
  const xScale = scalePoint<number>()
    .domain(points.map((_, i) => i))
    .range([0, width]);
  const yScale = scaleLinear()
    .domain(rechartsNiceDomain(...miniValueDomain(points.map((p) => p.value))))
    .range([height, MINI_TOP_MARGIN]);
  return {
    points,
    x: (index: number) => xScale(index) ?? 0,
    y: (value: number) => yScale(value),
  };
}

/** Margin on every side of the bar mini (Recharts' default chart margin). */
export const MINI_BAR_MARGIN = 5;

export interface MiniBar extends MiniChartPoint {
  x: number;
  y: number;
  height: number;
  negative: boolean;
}

/**
 * Bar geometry: the most recent bars that fit, right-aligned, each 8px wide
 * and centered in its slot (offset truncated, as Recharts does), over a
 * zero-anchored value range rounded as Recharts does.
 */
export function miniBarGeometry(
  data: readonly MiniChartDatum[],
  width: number,
  height: number,
): MiniBar[] {
  const bars = toMiniChartPoints(recentBarsThatFit(data, width));
  if (bars.length === 0) return [];
  const start = MINI_BAR_MARGIN + miniBarsLeftPadding(bars.length, width);
  const slot = (width - MINI_BAR_MARGIN - start) / bars.length;
  const offset = Math.trunc((slot - MINI_BAR_WIDTH) / 2);
  const yScale = scaleLinear()
    .domain(rechartsNiceDomain(...miniValueDomain(bars.map((b) => b.value))))
    .range([height - MINI_BAR_MARGIN, MINI_BAR_MARGIN]);
  const zero = yScale(0);
  return bars.map((bar, i) => {
    const top = yScale(bar.value);
    return {
      ...bar,
      x: start + i * slot + offset,
      y: Math.min(top, zero),
      height: Math.abs(zero - top),
      negative: bar.value < 0,
    };
  });
}
