/**
 * Whether the legend's measured height should be deducted from the chart's
 * drawing height (legend laid out INSIDE the pinned box) versus placed below an
 * auto-height chart.
 *
 * An explicit `fitLegendInHeight` always wins; otherwise default to "fit" when
 * the consumer pinned a `height`. The test is `height !== undefined`, NOT
 * `!!height` — a pinned `height: 0` (or `""`) is still an explicit height and
 * must count as "fit"; `!!height` wrongly collapsed those to false (the R10
 * skew, where one cartesian site disagreed with the five non-cartesian ones).
 */
export function resolveShouldFitLegend(
  fitLegendInHeight: boolean | undefined,
  height: number | string | undefined,
): boolean {
  return fitLegendInHeight ?? height !== undefined;
}
