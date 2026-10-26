import { formatChange } from "./format";
import type { Band, ChartEvent, Definition, Kpi, Range, Target, ValueFormat } from "./schemas";

export { formatCurrency, formatNumber, formatPercent } from "./format";

// Deterministic sample data: the same arguments always return the same
// numbers, and changing a filter visibly changes them. "Today" is 10 Oct 2026.

export const TODAY = Date.UTC(2026, 9, 10);
/** When the sample data was last "updated": the time of the newest order. */
export const AS_OF = "Oct 10, 3:48 PM";
export const DAY = 86_400_000;

/** Days before today of a calendar date (month 1–12; day 0 is the month before's last day). */
export const daysAgoOf = (year: number, month: number, day: number) =>
  Math.round((TODAY - Date.UTC(year, month - 1, day)) / DAY);

/** Days in each period; this month to date is Oct 1–10. */
export const RANGE_DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90, mtd: 10 };

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Seeded PRNG (mulberry32); returns numbers in [0, 1). */
export function random(seed: string): () => number {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A number in [min, max) from a seed. */
export function between(seed: string, min: number, max: number): number {
  return min + random(seed)() * (max - min);
}

export const dayOfWeek = (daysAgo: number) => new Date(TODAY - daysAgo * DAY).getUTCDay();

/** A daily series ending today, oldest first, with weekly seasonality and gentle growth. */
export function dailySeries(
  seed: string,
  days: number,
  base: number,
  options: { weekend?: number; growth?: number; noise?: number } = {},
): number[] {
  const { weekend = 0.75, growth = 0.12, noise = 0.24 } = options;
  const next = random(seed);
  return Array.from({ length: days }, (_, i) => {
    const day = dayOfWeek(days - 1 - i);
    const weekly = day === 0 || day === 6 ? weekend : 1;
    return base * weekly * (1 + (i / days) * growth) * (1 - noise / 2 + next() * noise);
  });
}

export const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
export const mean = (values: number[]) => (values.length ? sum(values) / values.length : 0);
export const round = (value: number, digits = 1) => Number(value.toFixed(digits));

export function dateLabel(daysAgo: number, withYear = false): string {
  return new Date(TODAY - daysAgo * DAY).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

/** Day labels for the last `days` days, oldest first, e.g. "Oct 3". */
export function dayLabels(days: number): string[] {
  return Array.from({ length: days }, (_, i) => dateLabel(days - 1 - i));
}

/** "Sep 11 – Oct 10, 2026 vs prior 30 days", or vs whatever `against` names. */
export function periodLabel(range: Range, against?: string): string {
  const days = RANGE_DAYS[range];
  return `${dateLabel(days - 1)} – ${dateLabel(0, true)} vs ${against ?? `prior ${days} days`}`;
}

/**
 * Sums a daily series into weeks for 90-day views, which are too noisy day by
 * day. Weeks end today, so the oldest days that don't fill one (90 % 7 = 6)
 * make a short first week, and the weeks add up to the period's total.
 */
export function bucket(labels: string[], values: number[][], range: Range, average = false) {
  if (range !== "90d") return { labels, values };
  const size = 7;
  const out = values.map(() => [] as number[]);
  const outLabels: string[] = [];
  let end = labels.length % size || size;
  for (let start = 0; start < labels.length; start = end, end += size) {
    outLabels.push(`Wk of ${labels[start]}`);
    values.forEach((series, i) => {
      const week = series.slice(start, end);
      out[i].push(average ? mean(week) : sum(week));
    });
  }
  return { labels: outLabels, values: out };
}

/**
 * A shaded event for a time chart, matched to the chart's x labels: day labels
 * for 7d and 30d, the containing week for 90d. Undefined when out of range.
 */
export function eventSpan(
  range: Range,
  label: string,
  fromDaysAgo: number,
  toDaysAgo: number,
  detail?: string,
): ChartEvent | undefined {
  const days = RANGE_DAYS[range];
  if (toDaysAgo >= days) return undefined;
  const from = Math.min(fromDaysAgo, days - 1);
  const extra = detail ? { detail } : {};
  if (range !== "90d") {
    return { label, start: dateLabel(from), end: dateLabel(toDaysAgo), ...extra };
  }
  const daily = dayLabels(days);
  const offset = days % 7;
  // The same weeks as bucket(): a short first week of the oldest `offset` days, then full ones.
  const week = (daysAgo: number) => {
    const index = days - 1 - daysAgo;
    return `Wk of ${daily[index < offset ? 0 : offset + Math.floor((index - offset) / 7) * 7]}`;
  };
  return { label, start: week(from), end: week(toDaysAgo), ...extra };
}

/** A kit calendar's events that fall in the range, as chart events with their kind. */
export function calendarEvents(
  range: Range,
  events: {
    label: string;
    from: number;
    to: number;
    detail?: string;
    kind: NonNullable<ChartEvent["kind"]>;
  }[],
): ChartEvent[] {
  return events.flatMap((e) => {
    const span = eventSpan(range, e.label, e.from, e.to, e.detail);
    return span ? [{ ...span, kind: e.kind }] : [];
  });
}

/** How many earlier windows of this length to judge a change against (our rule). */
export const PAST_WINDOWS: Record<Range, number> = { "7d": 8, "30d": 6, "90d": 3, mtd: 8 };

/** At most `points` evenly spaced values, each the mean of its span, for sparklines. */
export function downsample(values: number[], points = 15): number[] {
  if (values.length <= points) return values.map((v) => round(v, 2));
  const step = values.length / points;
  return Array.from({ length: points }, (_, i) =>
    round(mean(values.slice(Math.floor(i * step), Math.floor((i + 1) * step))), 2),
  );
}

export function kpi(
  label: string,
  current: number,
  previous: number,
  format: (v: number) => string,
  options: {
    /** Daily values for the period, oldest first; also the sparkline. */
    series?: number[];
    /** Daily values for the comparison (previous period, last year, or plan). */
    previousSeries?: number[];
    /** What the comparison is, e.g. "Plan"; the trend says "Prior period" without it. */
    comparisonLabel?: string;
    goodDirection?: "up" | "down" | "neutral";
    hint?: string;
    /** How the metric is calculated, shown when hovering its value. */
    definition?: Definition;
    /** With a chart format, the KPI carries a full trend HeroMetric can show. */
    range?: Range;
    chart?: ValueFormat;
    /** A count whose weekly buckets add up, rather than a rate that averages. */
    total?: boolean;
    /** A goal or limit for the trend, e.g. a healthy LTV:CAC of 3x. */
    target?: Target;
    /** A benchmark range for the trend, e.g. DTC conversion of 1.5–3.5%. */
    band?: Band;
  } = {},
): Kpi {
  const change = previous === 0 ? 0 : ((current - previous) / Math.abs(previous)) * 100;
  return {
    label,
    value: format(current),
    previous: format(previous),
    change: round(change),
    ...(options.goodDirection ? { goodDirection: options.goodDirection } : {}),
    // Only real values: a KPI without a series has no sparkline.
    ...(options.series ? { series: downsample(options.series) } : {}),
    ...(options.hint ? { hint: options.hint } : {}),
    ...(options.definition ? { definition: options.definition } : {}),
    // A trend needs a value for every day of the period, so it is never invented.
    ...(options.range && options.chart && options.series?.length === RANGE_DAYS[options.range]
      ? { trend: kpiTrend(options.range, options.chart, options) }
      : {}),
  };
}

/**
 * A KPI's trend against its comparison, from the KPI's daily values. Metrics
 * with no daily source, such as LTV, have no trend.
 */
function kpiTrend(
  range: Range,
  format: ValueFormat,
  options: {
    series?: number[];
    previousSeries?: number[];
    comparisonLabel?: string;
    total?: boolean;
    target?: Target;
    band?: Band;
  },
) {
  const days = RANGE_DAYS[range];
  // kpi() only asks for a trend when the series has a value for every day; the
  // comparison line is drawn only when it does too.
  const comparison = options.previousSeries?.length === days ? options.previousSeries : undefined;
  const { labels, values } = bucket(
    dayLabels(days),
    comparison ? [options.series!, comparison] : [options.series!],
    range,
    !options.total,
  );
  return {
    labels,
    current: values[0]!.map((v) => round(v, 2)),
    ...(values[1] ? { previous: values[1].map((v) => round(v, 2)) } : {}),
    ...(options.comparisonLabel ? { comparisonLabel: options.comparisonLabel } : {}),
    format,
    // Every KPI trend ends today, which is still in progress.
    partial: true,
    ...(options.target ? { target: options.target } : {}),
    ...(options.band ? { band: options.band } : {}),
  };
}

/** "+12.4%" for insight figures. */
export const changeText = (current: number, previous: number) =>
  formatChange(previous === 0 ? 0 : ((current - previous) / Math.abs(previous)) * 100);
