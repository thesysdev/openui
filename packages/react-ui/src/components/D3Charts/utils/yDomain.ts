import type { ChartData } from "../types";

/**
 * The y domain for cartesian value charts, always anchored through zero.
 *
 * Non-stacked: `[min(0, dataMin), max(0, dataMax)]`. Stacked: per-row positive
 * values stack up from zero and negative values stack down — exactly d3's
 * `stackOffsetDiverging` (which `useStackedData` uses) — so the extent is
 * `[min(0, lowest negative sum), max(0, highest positive sum)]`. All-non-
 * negative data yields `[0, max]`, identical to the pre-negative-support
 * domain.
 *
 * Single source of truth for BOTH `useYScale` (the rendered scale) and
 * `useYAxisWidth` (tick-label measurement): the measured ticks are exactly the
 * rendered ones by construction, including stacked totals — the old width hook
 * measured per-value maxima and clipped stacked top ticks.
 */
export const computeYDomain = (
  data: ChartData,
  dataKeys: string[],
  stacked: boolean,
): [number, number] => {
  let min = 0;
  let max = 0;

  for (const row of data) {
    if (stacked) {
      let positiveSum = 0;
      let negativeSum = 0;
      for (const key of dataKeys) {
        const value = Number(row[key]) || 0;
        if (value >= 0) positiveSum += value;
        else negativeSum += value;
      }
      if (positiveSum > max) max = positiveSum;
      if (negativeSum < min) min = negativeSum;
    } else {
      for (const key of dataKeys) {
        const value = Number(row[key]) || 0;
        if (value > max) max = value;
        if (value < min) min = value;
      }
    }
  }

  return [min, max];
};
