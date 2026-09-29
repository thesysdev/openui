import type { ChartData } from "../types";

/**
 * How stacked series combine — the values mirror Recharts' `stackOffset`:
 * - `"sign"`: positive values stack up from zero, negative values stack down
 *   (bars — Recharts bar charts use `stackOffset="sign"`).
 * - `"none"`: one running total per row; a negative value lowers it (areas —
 *   Recharts area charts use the default `stackOffset`).
 */
export type StackOffset = "sign" | "none";

/**
 * The y domain for cartesian value charts, always anchored through zero.
 *
 * Non-stacked: `[min(0, dataMin), max(0, dataMax)]`. Stacked with `"sign"`:
 * per-row positive values stack up from zero and negative values stack down —
 * the offset `useStackedData` applies — so the extent is
 * `[min(0, lowest negative sum), max(0, highest positive sum)]`. Stacked with
 * `"none"`: the extent covers every intermediate running total of each row.
 * All-non-negative data yields `[0, max]` either way.
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
  stackOffset: StackOffset = "sign",
): [number, number] => {
  let min = 0;
  let max = 0;

  for (const row of data) {
    if (stacked && stackOffset === "none") {
      let total = 0;
      for (const key of dataKeys) {
        total += Number(row[key]) || 0;
        if (total > max) max = total;
        if (total < min) min = total;
      }
    } else if (stacked) {
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
