import type { TrendChartSeries } from "../TrendChart/types";
import { MUTED_COLOR, SERIES_COLORS } from "../utils/constants";

export type ColoredSeries = TrendChartSeries & { color: string };

/** Status colors from the kit theme, for series that stand for a state (healthy, at risk). */
const TONE_COLORS = { good: "var(--kit-good)", warn: "var(--kit-warn)", bad: "var(--kit-bad)" };

const LOSS_COLOR = "var(--kit-down)";

/** A series wholly at or below zero, with some loss: lapsed, dormant, churned. */
function isLoss(s: TrendChartSeries) {
  const finite = s.values.filter(Number.isFinite);
  return finite.length > 0 && finite.every((v) => v <= 0) && finite.some((v) => v < 0);
}

/** Whether a chart pairs gains above zero with losses below it. */
function isPolarity(series: TrendChartSeries[]) {
  const losses = series.map(isLoss);
  return losses.some(Boolean) && losses.some((l) => !l);
}

/**
 * How many series take a colour from the theme's chart palette: every one
 * without an explicit colour or tone that is not muted context and not a loss.
 * Pass it to useKitPalette, then pass the result to colorSeries.
 */
export function paletteCount(series: TrendChartSeries[]): number {
  const polarity = isPolarity(series);
  return series.filter(
    (s) => !s.color && !s.tone && s.emphasis !== "muted" && !(polarity && isLoss(s)),
  ).length;
}

/**
 * Colour each series: an explicit colour wins, then a status tone, then muted
 * context in gray, then, in order, the palette colours (the theme's chart
 * palette, distributed as OpenUI's own charts do; see useKitPalette).
 *
 * A chart of gains above zero and losses below it (new and lapsed customers)
 * is polarity, not identity: the losses take the destructive colour and the
 * gains the palette.
 */
export function colorSeries(series: TrendChartSeries[], palette: string[] = []): ColoredSeries[] {
  const polarity = isPolarity(series);
  let next = 0;
  return series.map((s) => {
    if (s.color) return { ...s, color: s.color };
    if (s.tone) return { ...s, color: TONE_COLORS[s.tone] };
    if (s.emphasis === "muted") return { ...s, color: MUTED_COLOR };
    if (polarity && isLoss(s)) return { ...s, color: LOSS_COLOR };
    const k = next++;
    return { ...s, color: palette[k] ?? SERIES_COLORS[k % SERIES_COLORS.length]! };
  });
}

/**
 * A comparison drawn against one series (this period against the prior one,
 * actual against plan) takes that series' own colour, lighter and dashed, the
 * way Material, SAP, PostHog, and Polaris draw a prior period: the same thing
 * at another time, not a new thing in a new colour. With several strong series
 * the context line stays gray, since it belongs to none of them.
 */
export function comparisonInSeriesColor(
  colored: ColoredSeries[],
  raw: TrendChartSeries[],
): ColoredSeries[] {
  const strong = colored.filter((s) => s.emphasis !== "muted");
  if (strong.length !== 1) return colored;
  const lead = strong[0]!.color;
  return colored.map((s, i) =>
    s.emphasis === "muted" && !raw[i]?.color && !raw[i]?.tone
      ? { ...s, color: `color-mix(in oklab, ${lead} 45%, transparent)` }
      : s,
  );
}
