import { defineFunction } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { isoDay, parseDate } from "./dates";
import { agg, aggregate, finite, groups, list, MAX_ITEMS, numbers, read, toNum, type Agg } from "./shared";

const keyValue = () => z.array(z.object({ key: z.union([z.string(), z.number()]), value: z.number() }));
// Untyped arrays (a pluck over rows that lack the field) can still hold nulls
const finiteOnly = (values: unknown[]) => values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
const defaultAgg = (field: string | undefined, how: Agg | undefined): Agg => how ?? (field ? "sum" : "count");

/** Copy of each row with `field` replaced; field "" maps a list of numbers. */
function mapField(rows: unknown[], field: string, values: number[]): unknown[] {
  return rows.map((row, i) => (field ? { ...(row as object), [field]: values[i] } : values[i]));
}

export const GroupBy = defineFunction({
  name: "GroupBy",
  description:
    'One row per distinct key, in first-seen order; value is agg of field (default "sum"), or the row count without a field',
  params: z.object({ rows: list(), key: z.string(), field: z.string().optional(), agg: agg().optional() }),
  returns: keyValue(),
  fn: ({ rows, key, field, agg: how }) =>
    [...groups(rows, key)].map(([k, members]) => ({ key: k, value: aggregate(members, field, defaultAgg(field, how)) })),
});

export const Pivot = defineFunction({
  name: "Pivot",
  description: "One row per rowKey value with a column per colKey value holding agg of field, for stacked or grouped charts",
  params: z.object({
    rows: list(),
    rowKey: z.string(),
    colKey: z.string(),
    field: z.string().optional(),
    agg: agg().optional(),
  }),
  returns: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
  fn: ({ rows, rowKey, colKey, field, agg: how }) => {
    const cols = [...groups(rows, colKey).keys()].map(String);
    return [...groups(rows, rowKey)].map(([k, members]) => {
      const out: Record<string, string | number> = { key: k };
      for (const col of cols) out[col] = 0;
      for (const [c, cell] of groups(members, colKey)) out[String(c)] = aggregate(cell, field, defaultAgg(field, how));
      return out;
    });
  },
});

export const Top = defineFunction({
  name: "Top",
  description: 'The n rows with the largest field ("asc": the smallest)',
  params: z.object({ rows: list(), field: z.string(), n: z.number(), direction: z.enum(["desc", "asc"]).optional() }),
  returns: list(),
  fn: ({ rows, field, n, direction = "desc" }) => {
    const sign = direction === "asc" ? 1 : -1;
    const ranked = rows
      .map((row, i) => ({ row, i, v: toNum(read(row, field)) }))
      .sort((a, b) => {
        if (a.v === null || b.v === null) return a.v === b.v ? a.i - b.i : a.v === null ? 1 : -1;
        return (a.v - b.v) * sign || a.i - b.i;
      });
    return ranked.slice(0, Math.max(0, Math.trunc(n))).map((r) => r.row);
  },
});

/** Orders two field values: numbers by value, anything else (such as "YYYY-MM-DD") as text. */
function compare(a: unknown, b: unknown): number {
  const x = toNum(a);
  const y = toNum(b);
  if (x !== null && y !== null) return x - y;
  const s = String(a);
  const t = String(b);
  return s < t ? -1 : s > t ? 1 : 0;
}

export const Between = defineFunction({
  name: "Between",
  description:
    'Rows whose field is from min to max, both included; compares numbers, or text such as "YYYY-MM-DD" dates. Leave min or max null for an open end',
  params: z.object({ rows: list(), field: z.string(), min: z.any().optional(), max: z.any().optional() }),
  returns: list(),
  fn: ({ rows, field, min, max }) =>
    rows.filter((row) => {
      const v = read(row, field);
      if (v == null) return false;
      return (min == null || compare(v, min) >= 0) && (max == null || compare(v, max) <= 0);
    }),
});

function periodStart(day: number, unit: "day" | "week" | "month"): number {
  if (unit === "day") return day;
  if (unit === "week") return day - ((new Date(day * 86_400_000).getUTCDay() + 6) % 7); // Monday
  const d = new Date(day * 86_400_000);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) / 86_400_000;
}

function nextPeriod(start: number, unit: "day" | "week" | "month"): number {
  if (unit === "day") return start + 1;
  if (unit === "week") return start + 7;
  const d = new Date(start * 86_400_000);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) / 86_400_000;
}

export const Bucket = defineFunction({
  name: "Bucket",
  description:
    'Rows per day, week (from Monday) or month of dateField, in date order, empty periods 0 for sum and count; key is "YYYY-MM-DD", or "YYYY-MM" for months',
  params: z.object({
    rows: list(),
    dateField: z.string(),
    unit: z.enum(["day", "week", "month"]),
    field: z.string().optional(),
    agg: agg().optional(),
  }),
  returns: keyValue(),
  fn: ({ rows, dateField, unit, field, agg: how }) => {
    const byPeriod = new Map<number, unknown[]>();
    for (const row of rows) {
      const raw = read(row, dateField);
      if (typeof raw !== "string" && typeof raw !== "number") continue;
      let day: number;
      try {
        day = parseDate(raw).day;
      } catch {
        continue;
      }
      const start = periodStart(day, unit);
      const bucket = byPeriod.get(start);
      if (bucket) bucket.push(row);
      else byPeriod.set(start, [row]);
    }
    if (!byPeriod.size) return [];
    const mode = defaultAgg(field, how);
    const fill = mode === "sum" || mode === "count";
    const label = (start: number) => (unit === "month" ? isoDay(start).slice(0, 7) : isoDay(start));
    const starts = [...byPeriod.keys()].sort((a, b) => a - b);
    const out: { key: string; value: number }[] = [];
    for (let s = starts[0]!; s <= starts[starts.length - 1]!; s = nextPeriod(s, unit)) {
      const members = byPeriod.get(s);
      if (members) out.push({ key: label(s), value: aggregate(members, field, mode) });
      else if (fill) out.push({ key: label(s), value: 0 });
      if (out.length > MAX_ITEMS) throw new Error(`more than ${MAX_ITEMS} periods`);
    }
    return out;
  },
});

export const Cumulative = defineFunction({
  name: "Cumulative",
  description: 'Copy of the rows with field replaced by its running total (field "" for a list of numbers)',
  params: z.object({ rows: list(), field: z.string() }),
  returns: list(),
  fn: ({ rows, field }) => {
    let total = 0;
    return mapField(rows, field, rows.map((row) => (total += toNum(read(row, field)) ?? 0)));
  },
});

export const MovingAvg = defineFunction({
  name: "MovingAvg",
  description: 'Copy of the rows with field replaced by the average of its last window values (field "" for a list of numbers)',
  params: z.object({ rows: list(), field: z.string(), window: z.number() }),
  returns: list(),
  fn: ({ rows, field, window }) => {
    const w = Math.trunc(window);
    if (w < 1) throw new Error("window must be at least 1");
    const values = rows.map((row) => toNum(read(row, field)) ?? 0);
    const averages = values.map((_, i) => {
      const span = values.slice(Math.max(0, i - w + 1), i + 1);
      return span.reduce((a, b) => a + b, 0) / span.length;
    });
    return mapField(rows, field, averages);
  },
});

export const Change = defineFunction({
  name: "Change",
  description: "Percent change from previous to current, e.g. @Change(120, 100) is 20; null when previous is 0",
  params: z.object({ current: z.number(), previous: z.number() }),
  returns: z.number().nullable(),
  // No previous value is normal while data loads, so it is null without an error
  fn: ({ current, previous }) => (previous === 0 ? null : finite(((current - previous) / Math.abs(previous)) * 100)),
});

export const Histogram = defineFunction({
  name: "Histogram",
  description:
    "Counts numbers into equal-width bins (value is the count); min and max fix the range, default the data's",
  params: z.object({ values: numbers(), bins: z.number(), min: z.number().optional(), max: z.number().optional() }),
  returns: z.array(z.object({ key: z.string(), value: z.number(), start: z.number(), end: z.number() })),
  fn: ({ values: raw, bins, min, max }) => {
    const values = finiteOnly(raw);
    const n = Math.trunc(bins);
    if (n < 1 || n > 500) throw new Error("bins must be from 1 to 500");
    const lo = min ?? (values.length ? Math.min(...values) : 0);
    let hi = max ?? (values.length ? Math.max(...values) : 1);
    if (hi <= lo) hi = lo + 1;
    const width = (hi - lo) / n;
    const decimals = Math.max(0, 1 - Math.floor(Math.log10(width)));
    const counts = new Array<number>(n).fill(0);
    for (const v of values) {
      if (v < lo || v > hi) continue;
      counts[Math.min(n - 1, Math.floor((v - lo) / width))]!++;
    }
    return counts.map((value, i) => {
      const start = lo + i * width;
      return { key: String(Number(start.toFixed(decimals))), value, start, end: start + width };
    });
  },
});

export const Stats = defineFunction({
  name: "Stats",
  description: "Summary of numbers, all zeros for an empty list",
  params: z.object({ values: numbers() }),
  returns: z.object({
    count: z.number(),
    min: z.number(),
    max: z.number(),
    mean: z.number(),
    median: z.number(),
    stdev: z.number(),
  }),
  fn: ({ values: raw }) => {
    const values = finiteOnly(raw);
    const count = values.length;
    if (!count) return { count: 0, min: 0, max: 0, mean: 0, median: 0, stdev: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / count;
    const mid = Math.floor(count / 2);
    const median = count % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
    const stdev = Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / count);
    return { count, min: sorted[0]!, max: sorted[count - 1]!, mean, median, stdev };
  },
});

export const dataFunctions = [GroupBy, Pivot, Top, Between, Bucket, Cumulative, MovingAvg, Change, Histogram, Stats];
