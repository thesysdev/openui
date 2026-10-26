import { scaleLinear, type ScaleLinear } from "d3-scale";

/**
 * A linear value scale over the data (and any guides that must stay in view),
 * rounded to nice ticks the way react-ui's charts round theirs. It includes
 * zero, so areas and columns keep a true baseline, unless `zero` is false:
 * then it fits the data, for lines whose movement matters more than their
 * distance from zero.
 */
export function valueScale(
  values: number[],
  range: [bottom: number, top: number],
  tickCount = 4,
  zero = true,
): { scale: ScaleLinear<number, number>; ticks: number[] } {
  const finite = values.filter(Number.isFinite);
  const lo = Math.min(...finite);
  const hi = Math.max(...finite);
  // Fitted: pad by a tenth of the spread so the line never rides an edge.
  const pad = (hi - lo || Math.abs(hi) || 1) * 0.1;
  const min = zero ? Math.min(0, lo) : lo - pad;
  const max = zero ? Math.max(0, hi) : hi + pad;
  const scale = scaleLinear()
    .domain(min === max ? [min, min + 1] : [min, max])
    .range(range)
    .nice(tickCount);
  return { scale, ticks: scale.ticks(tickCount) };
}

/**
 * Indexes of the x labels to draw so none collide: evenly spaced, always
 * ending on the last one, dropping the one before it when they would crowd.
 */
export function labelIndexes(count: number, width: number, labelWidth = 64): number[] {
  if (count <= 1) return count ? [0] : [];
  const fit = Math.max(2, Math.floor(width / labelWidth));
  const step = Math.ceil((count - 1) / (fit - 1));
  const out: number[] = [];
  for (let i = 0; i < count; i += step) out.push(i);
  if (out[out.length - 1] !== count - 1) {
    if (count - 1 - out[out.length - 1]! < Math.max(step / 2, 3)) out.pop();
    out.push(count - 1);
  }
  return out;
}

/** The widest of a set of axis labels in px, at the kit's 11px tick type. */
export function labelWidth(labels: string[], charWidth = 7): number {
  return Math.max(0, ...labels.map((label) => label.length)) * charWidth;
}

/**
 * Whether a line chart should fit its values instead of starting at zero:
 * every value on one side of zero, and the spread under half the size, so a
 * zero baseline would flatten the movement (a rate near 110%, a steady count).
 */
export function fitsWithoutZero(values: number[]): boolean {
  const finite = values.filter(Number.isFinite);
  if (finite.length < 2) return false;
  const lo = Math.min(...finite);
  const hi = Math.max(...finite);
  if (lo <= 0 && hi >= 0) return false;
  const far = Math.max(Math.abs(lo), Math.abs(hi));
  return (hi - lo) / far < 0.5;
}
