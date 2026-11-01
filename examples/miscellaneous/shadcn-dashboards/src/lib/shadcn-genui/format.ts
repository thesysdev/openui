// Formatting shared by the dashboard components. Data tools return raw numbers and ISO dates;
// the components make them readable, so generated dashboards don't have to.

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export type NumberFormat = "number" | "compact" | "percent";

export function formatNumber(value: number, format: NumberFormat = "number"): string {
  if (!Number.isFinite(value)) return "–";
  if (format === "compact") return compact.format(value);
  if (format === "percent") return `${whole.format(value)}%`;
  return whole.format(value);
}

const DAY = /^\d{4}-\d{2}-\d{2}(T.*)?$/;
const MONTH = /^\d{4}-\d{2}$/;

/** "2026-05-04" → "May 4, 2026"; "2026-05" → "May 2026"; anything else as is. */
export function formatDate(value: string, short = false): string {
  if (MONTH.test(value)) {
    const date = new Date(`${value}-01T00:00:00Z`);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: short ? "2-digit" : "numeric",
      timeZone: "UTC",
    });
  }
  if (DAY.test(value)) {
    const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      ...(short ? {} : { year: "numeric" }),
      timeZone: "UTC",
    });
  }
  return value;
}

export const isDateLike = (value: unknown): value is string =>
  typeof value === "string" && (DAY.test(value) || MONTH.test(value));

/** Props that are still streaming in can be missing or the wrong shape. */
export const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : value == null ? [] : [value];

export type ElementNode = { type: "element"; props: Record<string, unknown> };

export const isElement = (value: unknown): value is ElementNode =>
  typeof value === "object" && value !== null && (value as { type?: unknown }).type === "element";
