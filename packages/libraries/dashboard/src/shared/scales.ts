import { columnDecimals, computeDelta, formatValue, padDecimals, type ValueFormat } from "./format";

/** A 1, 2, 2.5 or 5 × 10ⁿ step close to `raw`. */
export function niceStep(raw: number) {
  const power = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / power;
  return (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 2.5 ? 2.5 : unit <= 5 ? 5 : 10) * power;
}

/**
 * Round ticks and a domain that ends on them, for scales drawn in HTML rows. `pad` is the share of the
 * span kept clear at each end; data that can't go below zero gets no negative ticks unless `zeroFloor` is off.
 */
export function niceScale(
  values: number[],
  {
    ticks = 4,
    pad = 0.02,
    zeroFloor = true,
  }: { ticks?: number; pad?: number; zeroFloor?: boolean } = {},
) {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || Math.abs(hi) || 1;
  const step = niceStep(span / ticks);
  const floor = Math.floor((lo - span * pad) / step) * step;
  const min = zeroFloor && lo >= 0 ? Math.max(0, floor) : floor;
  const max = Math.ceil((hi + span * pad) / step) * step;
  const x = (value: number) => `${((value - min) / (max - min || 1)) * 100}%`;
  const list = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => min + i * step);
  return { min, max, x, ticks: list };
}
/** Decimals for a column of changes, so +7% and +7.9% read +7.0% and +7.9%. */
export function deltaDecimals(
  pairs: { current: number | null | undefined; previous: number | null | undefined }[],
  format?: ValueFormat | null,
) {
  const texts = pairs
    .map((p) =>
      typeof p.current === "number" && typeof p.previous === "number"
        ? computeDelta(p.current, p.previous, format)?.text
        : undefined,
    )
    .filter((t): t is string => !!t)
    .map((t) => t.replace(/^[+-]/, ""));
  return columnDecimals(texts);
}

/** Formats a column of values to one shared number of decimals. */
export function columnFormatter(
  values: (number | null | undefined)[],
  format?: ValueFormat | null,
) {
  const decimals = columnDecimals(
    values
      .filter((v): v is number => typeof v === "number")
      .map((v) => formatValue(Math.abs(v), format)),
  );
  return (value: number | null | undefined) => padDecimals(formatValue(value, format), decimals);
}
