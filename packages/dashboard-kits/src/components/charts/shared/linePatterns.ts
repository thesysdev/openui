import type { TrendChartSeries } from "../TrendChart/types";

/**
 * How a line is stroked. `context` is the existing dash of muted and dashed
 * series; the others tell strong series apart when their colors are close.
 */
export type LinePattern = "solid" | "long" | "short" | "dotDash" | "context";

/**
 * SVG dash arrays for a 2px round-capped line (the caps add 2px to every dash
 * and take it from every gap). Each repeats within the 24px legend key, so the
 * key shows the same rhythm as the line. `context` stays 4 4, which none of
 * the strong patterns match.
 */
export const DASH_ARRAYS: Record<LinePattern, string | undefined> = {
  solid: undefined,
  long: "12 5",
  short: "2 6",
  dotDash: "8 5 0.1 5",
  context: "4 4",
};

/** Strong series take these in order. */
const STRONG: LinePattern[] = ["solid", "long", "short", "dotDash"];

/** Strong series a chart can draw before identity needs more than color. */
const MAX_COLOR_ONLY = 2;

/**
 * A pattern per series, or null when color alone is enough. Three or more
 * strong lines take neighbouring steps of one ramp (Ocean's 2196F3, 42A5F5,
 * 64B5F6), close enough to confuse, so each strong line after the first gets a
 * dash of its own and identity never rests on color alone. Muted and dashed
 * series keep their context dash and do not count. One or two strong series
 * are left as they are.
 */
export function linePatterns(
  series: Pick<TrendChartSeries, "emphasis" | "dashed">[],
): LinePattern[] | null {
  const context = (s: Pick<TrendChartSeries, "emphasis" | "dashed">) =>
    s.emphasis === "muted" || !!s.dashed;
  if (series.filter((s) => !context(s)).length <= MAX_COLOR_ONLY) return null;
  let next = 0;
  return series.map((s) => (context(s) ? "context" : STRONG[next++ % STRONG.length]!));
}
