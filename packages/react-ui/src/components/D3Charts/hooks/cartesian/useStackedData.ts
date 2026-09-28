import type { Series } from "d3-shape";
import { stack, stackOffsetNone, stackOrderNone } from "d3-shape";
import { useMemo } from "react";
import type { ChartData } from "../../types";
import type { StackOffset } from "../../utils/yDomain";

export type StackedData = Series<Record<string, string | number>, string>[];

/**
 * d3's stackOffsetDiverging with ONE change: zero-value segments ride the
 * positive running total instead of being re-based to [0, 0]. d3's zero branch
 * (`d[0] = 0, d[1] = dy`) pins zeros to the baseline, which visibly drops a
 * stacked AREA series' band/line to the floor wherever a value is exactly 0 —
 * stackOffsetNone (the previous offset) kept zeros at the running cumulative.
 * With this branch, all-non-negative data produces output identical to
 * stackOffsetNone (pixel-compat), while mixed signs still diverge: positives
 * stack up from zero, negatives stack down.
 */
export const stackOffsetDivergingZeroPreserving = (
  series: Series<Record<string, string | number>, string>[],
  order: Iterable<number>,
): void => {
  const orderArr = Array.from(order);
  const n = series.length;
  if (n === 0) return;
  const m = series[orderArr[0]!]!.length;
  for (let j = 0; j < m; ++j) {
    let positiveSum = 0;
    let negativeSum = 0;
    for (let i = 0; i < n; ++i) {
      const d = series[orderArr[i]!]![j]!;
      const dy = d[1] - d[0];
      if (dy > 0) {
        d[0] = positiveSum;
        d[1] = positiveSum += dy;
      } else if (dy < 0) {
        d[1] = negativeSum;
        d[0] = negativeSum += dy;
      } else {
        // Zero: ride the positive running total (d3 re-bases to [0, dy]).
        d[0] = positiveSum;
        d[1] = positiveSum;
      }
    }
  }
};

export const useStackedData = (
  data: ChartData,
  dataKeys: string[],
  stacked: boolean,
  stackOffset: StackOffset = "sign",
): StackedData | null => {
  return useMemo(() => {
    if (!stacked || dataKeys.length === 0) return null;

    const stackGenerator = stack<Record<string, string | number>>()
      .keys(dataKeys)
      .order(stackOrderNone)
      .offset(stackOffset === "none" ? stackOffsetNone : stackOffsetDivergingZeroPreserving);

    return stackGenerator(data as Iterable<{ [key: string]: number }>);
  }, [data, dataKeys, stacked, stackOffset]);
};
