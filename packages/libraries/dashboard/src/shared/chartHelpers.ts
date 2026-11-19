"use client";

import { z } from "zod/v4";
import { MUTED_COLOR, seriesColor as themeSeriesColor } from "./colors";
import { formatValue, type ValueFormat } from "./format";
import { type LegendEntry } from "./legend";
import { niceStep } from "./scales";
import { type ReferenceProps, type SeriesProps } from "./trends";
import { toNumbers } from "./values";

export const seriesColor = (index: number): string => themeSeriesColor(index) ?? MUTED_COLOR;

/* ---------- Shared chart plumbing ---------- */

export const AXIS_TICK = { fill: "var(--openui-dashboard-ink-muted)", fontSize: 12 };

/** One bar thickness across every chart (TimeSeries, Bars, Waterfall); previous-period ghosts beside a bar run at half. */
export const BAR_SIZE = 12;

/**
 * No bar is drawn thinner than this. Past it, horizontal bars grow the chart
 * taller, and vertical bars give the plot a minimum width and scroll sideways
 * inside the card rather than shrink to slivers.
 */
export const BAR_MIN = 6;

/**
 * The band one category needs for `bars` side-by-side bars of BAR_MIN, 2px apart.
 * Recharts takes the category gap (a share of the band) from both sides, hence 1 - 2 × gap.
 */
export const bandFor = (bars: number, gap: number) =>
  (bars * BAR_MIN + Math.max(0, Math.ceil(bars) - 1) * 2) / (1 - 2 * gap);

/**
 * Vertical bars: the plot width that keeps every bar at BAR_MIN, or 0 when the
 * card is already wide enough. `chrome` is the axis and margins beside the bars.
 */
export function minPlotWidth(
  width: number,
  labels: number,
  bars: number,
  gap: number,
  chrome = 64,
) {
  if (!width || !bars) return 0;
  // One spare pixel per bar: Recharts rounds bar sizes down.
  const need = Math.ceil(labels * bandFor(bars, gap) * ((BAR_MIN + 1) / BAR_MIN) + chrome);
  return need > width ? need : 0;
}

/** A line drawn over bars is in the same unit (the Series docs require it), so it
 *  summarises them, e.g. a 7-day average: neutral ink, not a category hue. */
export const SUMMARY_COLOR = "var(--openui-dashboard-ink-secondary)";

/** Top margin a chart leaves when a vertical line's chip sits above its plot: the 18px chip, less its 3px overlap, plus 9px of air above. */
export const CHIP_ROOM = 24;

/** The reference chip's measurements, shared by the SVG chip on chart lines and the HTML chip on row charts. */
/** The least height a plot keeps: below it, a card grows rather than squash the chart. Rows set the real height. */
export const PLOT_FLOOR = 200;

export type Row = Record<string, string | number | null>;

export const DURATION_STEPS = [
  1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400, 172800,
  604800,
];

/** Zero-based ticks on whole durations (30s, 1m, 5m, 1h, …) instead of 65s, 130s. */
export function durationTicks(
  rows: Row[],
  keys: string[],
  extra: number[] = [],
): number[] | undefined {
  let max = Math.max(0, ...extra);
  for (const row of rows)
    for (const key of keys)
      if (typeof row[key] === "number") max = Math.max(max, row[key] as number);
  if (!max) return undefined;
  const step = DURATION_STEPS.find((candidate) => max / candidate <= 5) ?? Math.ceil(max / 5);
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
}

/**
 * Value-axis ticks on 1, 2, 2.5 or 5 × 10ⁿ steps, from zero (or below it, for negative data) to
 * just past the data, so an axis never counts in 950K steps as Recharts' own ticks can. A stacked
 * row counts as its positive and negative sums; whole-number data keeps whole-number steps.
 */
export function niceTicks(
  rows: Row[],
  keys: string[],
  extra: number[] = [],
  { stacked = false, integers = false }: { stacked?: boolean; integers?: boolean } = {},
): number[] | undefined {
  const values = extra.filter(Number.isFinite);
  for (const row of rows) {
    let up = 0;
    let down = 0;
    for (const key of keys) {
      const value = row[key];
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      if (!stacked) values.push(value);
      else if (value > 0) up += value;
      else down += value;
    }
    if (stacked) values.push(up, down);
  }
  const lo = Math.min(0, ...values);
  const hi = Math.max(0, ...values);
  if (lo === hi) return undefined;
  const raw = niceStep((hi - lo) / 4);
  // Whole numbers step by 1, 2 or 5 × 10ⁿ: a 2.5 step would print 7.5.
  const step = integers && !Number.isInteger(raw) ? Math.max(1, Math.floor(raw)) : raw;
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  return Array.from({ length: Math.round((end - start) / step) + 1 }, (_, i) =>
    Number((start + i * step).toPrecision(12)),
  );
}

/**
 * Which end of a horizontal reference line its chip should sit at: the start, unless the data
 * passes closer to the line there than at the end (the chip would cover it).
 */
export function chipAlign(rows: Row[], keys: string[], value: number): "start" | "end" {
  const edge = Math.max(1, Math.ceil(rows.length * 0.2));
  const clearance = (slice: Row[]) =>
    Math.min(
      Infinity,
      ...slice.flatMap((row) =>
        keys.flatMap((key) => {
          const point = row[key];
          return typeof point === "number" ? [Math.abs(point - value)] : [];
        }),
      ),
    );
  return clearance(rows.slice(-edge)) > clearance(rows.slice(0, edge)) ? "end" : "start";
}

/** Whole-number data gets whole-number ticks (no "0.2 signups"). */
export function allIntegers(rows: Row[], keys: string[]) {
  return rows.every((row) =>
    keys.every((key) => typeof row[key] !== "number" || Number.isInteger(row[key])),
  );
}

export function buildRows(labels: string[], series: SeriesProps[]): Row[] {
  return labels.map((label, i) => {
    const row: Row = { label };
    series.forEach((s, index) => {
      row[`s${index}`] = toNumbers(s.values)[i] ?? null;
      row[`p${index}`] = toNumbers(s.previous)[i] ?? null;
      if (s.lows || s.highs) {
        row[`lo${index}`] = toNumbers(s.lows)[i] ?? null;
        row[`hi${index}`] = toNumbers(s.highs)[i] ?? null;
      }
    });
    return row;
  });
}

export function yAxisWidth(rows: Row[], keys: string[], format?: ValueFormat | null) {
  let longest = 0;
  for (const row of rows) {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === "number")
        longest = Math.max(longest, formatValue(value, format, { axis: true }).length);
    }
  }
  // Ticks are rounder (and often one step past) the data, and % or $ glyphs run
  // wide, so leave a character of slack.
  return Math.min(80, Math.max(40, (longest + 1) * 7 + 8));
}

export function hasPrevious(series: SeriesProps[]) {
  return series.some((s) => toNumbers(s.previous).some((value) => value !== null));
}

export function legendFor(
  series: SeriesProps[],
  showPrevious: boolean,
  previousLabel: string,
  bars = false,
  references: ReferenceProps[] = [],
  summary: (i: number) => boolean = () => false,
): LegendEntry[] {
  // A summary line (a line over bars) is keyed as the neutral line it draws.
  const entries: LegendEntry[] = series
    .slice(0, 8)
    .map((s, i) =>
      summary(i)
        ? { name: s.name, color: SUMMARY_COLOR, line: true }
        : { name: s.name, color: seriesColor(i) },
    );
  if (series.length > 8) entries.push({ name: `${series.length - 8} more`, color: MUTED_COLOR });
  // A chart with previous data always carries the previous-period key, hidden
  // while compare is off, so switching compare on never changes card height.
  if (hasPrevious(series)) {
    // Bars draw the previous period as faded bars, lines as dashed lines: the key matches the mark.
    // With several series, previous bars are each series' own hue, faded; the key shows a faded swatch.
    const color =
      series.length === 1
        ? MUTED_COLOR
        : bars
          ? "color-mix(in srgb, var(--openui-dashboard-series-1) 40%, transparent)"
          : "var(--openui-dashboard-ink-muted)";
    entries.push({
      name: series.length > 1 && bars ? `${previousLabel} (faded)` : previousLabel,
      color,
      dashed: !bars,
      hidden: !showPrevious,
    });
  }
  // Reference lines (Plan, Target, SLO) are keyed as the dotted line they draw.
  for (const reference of references)
    entries.push({
      name: reference.label,
      color: "var(--openui-dashboard-ink-muted)",
      dotted: true,
    });
  return entries;
}

/** The previous-period mark colour: the muted grey for one series, a faded own hue for several. */
export const previousColor = (index: number, count: number) =>
  count === 1 ? MUTED_COLOR : seriesColor(index);

/* ---------- TimeSeries ---------- */

export const stackedSchema = z.union([z.boolean(), z.literal("percent")]);

/** Width of a label once WrappedTick splits it onto two lines, in px at 11px. */
export function wrappedLabelWidth(label: string) {
  const words = label.split(" ");
  const half = Math.ceil(words.length / 2);
  const lines =
    words.length > 1 ? [words.slice(0, half).join(" "), words.slice(half).join(" ")] : words;
  return Math.max(...lines.map((line) => line.length)) * 6.4;
}
