import { z } from "zod/v4";

/**
 * How a number is shown. Data stays numeric everywhere (so sorting, totals,
 * deltas and charts work); a format only decides how it reads.
 *
 * Presets:
 * - "number"            1,284 · 12,904
 * - "compact"           1,284 · 12.9K · 4.21M · 12.4M
 * - "currency"          $1,284 · $12,904
 * - "currency-compact"  $1,284 · $12.9K · $4.95M · $12.4M
 * - "currency-precise"  $1,284.50 (2 decimals)
 * - "percent"           value already in percent: 3.21 → 3.2%
 * - "ratio"             value is a fraction: 0.0321 → 3.2%
 * - "multiplier"        3.2 → 3.2x (ROAS, lift factors)
 * - "duration"          seconds: 238 → 3m 58s, 1.4 → 1.4s, 0.041 → 41ms
 * - "ms"                milliseconds: 238 → 238 ms, 1450 → 1.45 s
 * - "days"              2.5 → 2.5d
 *
 * Or an object for anything else: {type: "currency", currency: "EUR", decimals: 2}.
 */
export const FORMAT_PRESETS = [
  "number",
  "compact",
  "currency",
  "currency-compact",
  "currency-precise",
  "percent",
  "ratio",
  "multiplier",
  "duration",
  "ms",
  "days",
] as const;

export type FormatPreset = (typeof FORMAT_PRESETS)[number];

export const formatSchema = z.union([
  z.enum(FORMAT_PRESETS),
  z.object({
    type: z.enum(FORMAT_PRESETS),
    currency: z.string().optional(),
    decimals: z.number().optional(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
  }),
]);

export type ValueFormat = z.infer<typeof formatSchema>;

type Resolved = {
  type: FormatPreset;
  currency: string;
  decimals?: number;
  prefix: string;
  suffix: string;
};

function resolve(format: ValueFormat | undefined | null): Resolved {
  if (!format) return { type: "number", currency: "USD", prefix: "", suffix: "" };
  if (typeof format === "string") return { type: format, currency: "USD", prefix: "", suffix: "" };
  return {
    type: format.type,
    currency: format.currency ?? "USD",
    decimals: format.decimals,
    prefix: format.prefix ?? "",
    suffix: format.suffix ?? "",
  };
}

const cache = new Map<string, Intl.NumberFormat>();
function nf(base: Intl.NumberFormatOptions): Intl.NumberFormat {
  // "negative" never prints "-0" for values that round to zero.
  const options: Intl.NumberFormatOptions = { signDisplay: "negative", ...base };
  const key = JSON.stringify(options);
  let formatter = cache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", options);
    cache.set(key, formatter);
  }
  return formatter;
}

function compactDigits(value: number, decimals?: number) {
  if (decimals !== undefined) return decimals;
  const abs = Math.abs(value);
  // Single-digit millions and billions get a second decimal: $4.95M, not $5M.
  if ((abs >= 1e6 && abs < 1e7) || (abs >= 1e9 && abs < 1e10)) return 2;
  return abs >= 1000 ? 1 : 0;
}

/** One unit, no spaces, so axis ticks stay on one line: 45s · 25m · 1.5h · 3d. */
function axisDuration(seconds: number): string {
  const abs = Math.abs(seconds);
  const trim = (n: number) => nf({ maximumFractionDigits: 1 }).format(n);
  if (abs < 60) return `${trim(seconds)}s`;
  if (abs < 3600) return `${trim(seconds / 60)}m`;
  if (abs < 86400 * 2) return `${trim(seconds / 3600)}h`;
  return `${trim(seconds / 86400)}d`;
}

/**
 * A percentage that never lies at the edges: 99.999% stays 99.999% (not 100%),
 * and a tiny non-zero share reads "<0.1%" (not 0%).
 */
function percentText(pct: number, decimals: number | undefined, axis: boolean): string {
  if (decimals !== undefined) return `${nf({ maximumFractionDigits: decimals }).format(pct)}%`;
  if (axis) return `${nf({ maximumFractionDigits: Math.abs(pct) >= 1000 ? 0 : 2 }).format(pct)}%`;
  const abs = Math.abs(pct);
  if (abs >= 1000) return `${nf({ maximumFractionDigits: 0 }).format(pct)}%`;
  if (pct !== 0 && abs < 0.05) return `${pct < 0 ? "-" : ""}<0.1%`;
  if (abs < 100 && abs >= 99.95) return `${nf({ maximumFractionDigits: 3 }).format(pct)}%`;
  return `${nf({ maximumFractionDigits: 1 }).format(pct)}%`;
}

function duration(seconds: number): string {
  const sign = seconds < 0 ? "-" : "";
  const abs = Math.abs(seconds);
  // Latencies live below a second: under 0.1s read in milliseconds (41ms),
  // under 10s keep one decimal (0.5s, 1.4s), matching the axis beside them.
  if (abs > 0 && abs < 0.1) return `${sign}${Math.round(abs * 1000)}ms`;
  if (abs < 10 && Math.round(abs * 10) / 10 < 10)
    return `${sign}${nf({ maximumFractionDigits: 1 }).format(abs)}s`;
  let s = Math.round(abs);
  if (s < 60) return `${sign}${s}s`;
  // Two days and up read better in days: 102h → 4d 6h.
  if (s >= 172800) {
    // Round to whole hours first, so 71.6h reads 3d, not 2d 24h.
    const totalHours = Math.round(s / 3600);
    const d = Math.floor(totalHours / 24);
    const hours = totalHours - d * 24;
    return hours ? `${sign}${d}d ${hours}h` : `${sign}${d}d`;
  }
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  if (h) return m ? `${sign}${h}h ${m}m` : `${sign}${h}h`;
  return s ? `${sign}${m}m ${s}s` : `${sign}${m}m`;
}

/** Formats one value. Non-numbers (null, "—", text) come back as text. */
export function formatValue(
  value: unknown,
  format?: ValueFormat | null,
  options: { axis?: boolean } = {},
): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value !== "number" || !Number.isFinite(value)) return String(value);
  const f = resolve(format);
  // Axis ticks favour short labels: compact numbers, no decimals unless needed.
  const axis = options.axis ?? false;
  let text: string;
  switch (f.type) {
    case "compact":
      text = nf({
        notation: "compact",
        maximumFractionDigits: compactDigits(value, f.decimals),
      }).format(value);
      break;
    case "currency":
      text = axis
        ? nf({
            style: "currency",
            currency: f.currency,
            notation: "compact",
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
          }).format(value)
        : nf({
            style: "currency",
            currency: f.currency,
            maximumFractionDigits: f.decimals ?? 0,
          }).format(value);
      break;
    case "currency-compact":
      text = nf({
        style: "currency",
        currency: f.currency,
        notation: "compact",
        // Pinned: engines before the 2023 Intl change pad compact currency to the
        // currency's 2 digits ($12.50K, $4.90M); newer ones, like plain compact, don't.
        minimumFractionDigits: 0,
        maximumFractionDigits: compactDigits(value, f.decimals),
      }).format(value);
      break;
    case "currency-precise":
      text = nf({
        style: "currency",
        currency: f.currency,
        minimumFractionDigits: axis ? 0 : (f.decimals ?? 2),
        maximumFractionDigits: f.decimals ?? 2,
      }).format(value);
      break;
    case "percent":
      text = percentText(value, f.decimals, axis);
      break;
    case "ratio":
      text = percentText(value * 100, f.decimals, axis);
      break;
    case "multiplier":
      text = `${nf({ maximumFractionDigits: f.decimals ?? 1, minimumFractionDigits: axis ? 0 : (f.decimals ?? 1) }).format(value)}x`;
      break;
    case "duration":
      text = axis ? axisDuration(value) : duration(value);
      break;
    case "ms":
      // Axis ticks drop the space so the chart never wraps "800 ms" onto two lines.
      text =
        Math.abs(value) >= 1000
          ? `${nf({ maximumFractionDigits: axis ? 1 : 2 }).format(value / 1000)}${axis ? "s" : " s"}`
          : `${nf({ maximumFractionDigits: 0 }).format(value)}${axis ? "ms" : " ms"}`;
      break;
    case "days":
      text = `${nf({ maximumFractionDigits: f.decimals ?? 1 }).format(value)}d`;
      break;
    default: {
      const digits = f.decimals ?? 2;
      const smallest = 10 ** -digits;
      // A tiny non-zero value (a p-value of 0.00002) must not read as 0.
      text =
        !axis && value !== 0 && Math.abs(value) < smallest / 2
          ? `<${nf({ maximumFractionDigits: digits }).format(smallest)}`
          : axis && Math.abs(value) >= 10_000
            ? nf({ notation: "compact", maximumFractionDigits: 1 }).format(value)
            : nf({ maximumFractionDigits: digits }).format(value);
    }
  }
  return `${f.prefix}${text}${f.suffix}`;
}

export function isRatioFormat(format?: ValueFormat | null): boolean {
  return resolve(format).type === "ratio";
}

export function isDurationFormat(format?: ValueFormat | null): boolean {
  return resolve(format).type === "duration";
}

/**
 * Whether a format measures a rate, where change reads in points rather than percent. A number
 * with a "%" suffix (a margin written as {type: "number", suffix: "%"}) is a percent too.
 */
export function isRateFormat(format?: ValueFormat | null): boolean {
  const { type, suffix } = resolve(format);
  return type === "percent" || type === "ratio" || (type === "number" && suffix.trim() === "%");
}

export type Delta = { text: string; direction: "up" | "down" | "flat" };

/**
 * The change from `previous` to `current`: relative (+12.4%) for amounts,
 * absolute in points (+0.4 pts) for rates.
 */
export function computeDelta(
  current: number,
  previous: number,
  format?: ValueFormat | null,
): Delta | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (isRateFormat(format)) {
    const scale = resolve(format).type === "ratio" ? 100 : 1;
    const diff = (current - previous) * scale;
    // Near-ceiling rates (99.74% vs 99.71%) move in hundredths; don't round them to "+0".
    const digits = Math.abs(diff) < 0.1 ? 2 : 1;
    const direction = Math.abs(diff) < 0.005 ? "flat" : diff > 0 ? "up" : "down";
    return {
      text: `${diff > 0 ? "+" : ""}${nf({ maximumFractionDigits: digits }).format(diff)} pts`,
      direction,
    };
  }
  if (previous === 0) return null;
  // Across a sign flip (+$12K → −$48K) a percent change is meaningless: show the absolute change.
  if (previous < 0 || (current !== 0 && Math.sign(current) !== Math.sign(previous))) {
    const diff = current - previous;
    const direction = diff === 0 ? "flat" : diff > 0 ? "up" : "down";
    return { text: `${diff > 0 ? "+" : ""}${formatValue(diff, format)}`, direction };
  }
  const change = ((current - previous) / Math.abs(previous)) * 100;
  const direction = Math.abs(change) < 0.005 ? "flat" : change > 0 ? "up" : "down";
  const digits = Math.abs(change) >= 100 ? 0 : Math.abs(change) < 0.1 ? 2 : 1;
  return {
    text: `${change > 0 ? "+" : ""}${nf({ maximumFractionDigits: digits }).format(change)}%`,
    direction,
  };
}

/** Whether a delta is good news, given which direction is good for the metric. */
export function deltaTone(
  direction: Delta["direction"],
  goodWhen: "up" | "down" | "neutral" = "up",
) {
  if (direction === "flat" || goodWhen === "neutral") return "neutral" as const;
  return (direction === "up") === (goodWhen === "up") ? ("good" as const) : ("bad" as const);
}

/**
 * Decimals that line a column up: the most any value shows, but only when the
 * values share a unit after the number (%, x, " pts", " ms"). Mixed compact
 * suffixes ($950, $1.2K) are different scales and never padded.
 */
export function columnDecimals(texts: string[]): number {
  const parts = texts
    .map((t) => t.match(/^[^\d]*[\d,]+(?:\.(\d+))?(.*)$/))
    .filter((m): m is RegExpMatchArray => !!m);
  if (parts.length < 2) return 0;
  const suffixes = new Set(parts.map((m) => m[2]));
  if (suffixes.size > 1) return 0;
  return Math.max(...parts.map((m) => (m[1] ?? "").length));
}

/** Pads the first number in a formatted value to `decimals`: "35%" → "35.0%". */
export function padDecimals(text: string, decimals: number): string {
  if (!decimals) return text;
  return text.replace(
    /^([^\d]*[\d,]+)(?:\.(\d+))?/,
    (_, whole: string, frac = "") => `${whole}.${frac.padEnd(decimals, "0")}`,
  );
}

/* ---------- Dates ---------- */

// A date or timestamp as APIs return it: 2026-04-01, 2026-04-01T21:01:20.458Z, 2026-04-01 21:01:20+05:30.
const ISO_DATE =
  /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * The day an ISO date or timestamp names, or null for any other text. A bare date reads as local
 * midnight, so it shows the day it says in every time zone. An impossible day (2026-02-30) is
 * null rather than rolled over to the next month.
 */
export function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!ISO_DATE.test(text)) return null;
  // The strict shape every browser parses: "T" between date and time, a colon in the offset.
  const iso =
    text.length === 10
      ? `${text}T00:00:00`
      : text.replace(" ", "T").replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  const day = new Date(iso);
  if (Number.isNaN(day.getTime())) return null;
  // Date rolls an impossible day over (2026-02-30 to Mar 2); a real one reads back the same.
  const [year, month, date] = text.slice(0, 10).split("-").map(Number) as [number, number, number];
  const calendar = new Date(Date.UTC(year, month - 1, date));
  if (
    calendar.getUTCFullYear() !== year ||
    calendar.getUTCMonth() !== month - 1 ||
    calendar.getUTCDate() !== date
  ) {
    return null;
  }
  return day;
}

/** "Apr 2" this year, "Apr 23, 2012" before it: how a Table date column reads. */
export function formatDay(day: Date): string {
  const sameYear = day.getFullYear() === new Date().getFullYear();
  return day.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
}

// The en-US Date#toLocaleString() shape some data sources return: 10/1/2026, 12:00:00 AM. Only this
// one: its AM/PM marks the US month-first order, so 10/01/2026 can't be the 10th of January.
const US_DATETIME = /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)$/i;
// A year and month, as monthly data is often keyed: 2025-11.
const YEAR_MONTH = /^(\d{4})-(\d{2})$/;

/** A date read from text, with whether it names a whole month and whether it has a time of day. */
export type DateText = { date: Date; unit: "day" | "month"; time: boolean };

const atMidnight = (date: Date) =>
  date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0;

/**
 * The date a text names: an ISO date or timestamp, or the en-US toLocaleString() shape
 * (10/01/2026, 12:00:00 AM). Null for any other text, and for impossible days (02/30/2026), so a
 * version or a name is never read as a date. A year and month (2025-11) counts only with
 * `months`, for a whole set of values (an axis, a column): alone, "2026-04" may be a version.
 */
export function parseDateText(
  value: unknown,
  { months = false }: { months?: boolean } = {},
): DateText | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  const iso = parseIsoDate(text);
  if (iso) return { date: iso, unit: "day", time: text.length > 10 && !atMidnight(iso) };
  const month = months ? YEAR_MONTH.exec(text) : null;
  if (month) {
    const [year, index] = [Number(month[1]), Number(month[2]) - 1];
    return index >= 0 && index < 12
      ? { date: new Date(year, index, 1), unit: "month", time: false }
      : null;
  }
  const us = US_DATETIME.exec(text);
  if (!us) return null;
  const [m, d, y, h, min, sec] = [1, 2, 3, 4, 5, 6].map((i) => Number(us[i] ?? 0)) as number[];
  if (m! < 1 || m! > 12 || h! < 1 || h! > 12 || min! > 59 || sec! > 59) return null;
  const hours = (h! % 12) + (us[7]!.toUpperCase() === "PM" ? 12 : 0);
  const date = new Date(y!, m! - 1, d!, hours, min!, sec!);
  // A real day reads back the same; 02/30/2026 would roll over to March.
  if (date.getMonth() !== m! - 1 || date.getDate() !== d!) return null;
  return { date, unit: "day", time: !atMidnight(date) };
}

/** "Nov 2025": how a month reads. */
function formatMonth(date: Date, withYear: boolean): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: withYear ? "numeric" : undefined,
  });
}

/**
 * A date as a short day ("Apr 2"), or null for any other text (a version, a name). A day this
 * year leaves its year out, as a Table date column does. With `months`, a year and month reads
 * "Nov 2025".
 */
export function formatDateText(
  value: unknown,
  { months = false }: { months?: boolean } = {},
): string | null {
  const parsed = parseDateText(value, { months });
  if (!parsed) return null;
  return parsed.unit === "month" ? formatMonth(parsed.date, true) : formatDay(parsed.date);
}

/**
 * Chart category labels that are all dates, or all months, read as dates: "May 14" or "Nov 2025",
 * with the year only when some label falls outside this year, and the time only when two labels
 * share a day. Null when any label is other text, so names and quarters pass through untouched.
 */
export function dateLabels(labels: string[]): ((label: string) => string) | null {
  const shown = labels.filter((label) => label.trim() !== "");
  const parsed = shown.map((label) => parseDateText(label, { months: true }));
  if (!parsed.length || parsed.some((date) => !date)) return null;
  const dates = parsed as DateText[];
  const unit = dates[0]!.unit;
  if (dates.some((date) => date.unit !== unit)) return null;
  const year = new Date().getFullYear();
  const withYear = dates.some((date) => date.date.getFullYear() !== year);
  const day = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: withYear ? "numeric" : undefined,
    });
  const days = dates.map((date) => day(date.date));
  const timed = unit === "day" && new Set(days).size < days.length;
  const text = new Map(
    shown.map((label, i) => {
      const date = dates[i]!;
      if (unit === "month") return [label, formatMonth(date.date, withYear)];
      if (!timed) return [label, days[i]!];
      const time = date.date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      return [label, `${days[i]}, ${time}`];
    }),
  );
  return (label) => text.get(label) ?? label;
}
