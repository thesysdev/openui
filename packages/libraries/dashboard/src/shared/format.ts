const PLAIN_NUMBER = /^-?\d+(\.\d+)?$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
const HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/;

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// UTC, so the server and the browser print the same day.
const day = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** Shows an ISO date as a day: "2016-10-05T23:32:51Z" reads "Oct 5, 2016". Anything else is shown as written. */
export function formatDate(value: string): string {
  // A value that hasn't streamed in yet arrives as null.
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (!ISO_DATE.test(text)) return value;
  // A time without an offset is read as UTC, like a bare date.
  const date = new Date(text.includes("T") && !HAS_OFFSET.test(text) ? `${text}Z` : text);
  return Number.isNaN(date.getTime()) ? value : day.format(date);
}

/**
 * Shows an ISO date as a day (see formatDate) and shortens a plain number:
 * "48496340" reads "48.5M". Anything else ("$1.2K", "12%", "MIT") is shown as
 * written. Numbers below 10,000 stay as they are, so a year such as "2026" is not "2K".
 */
export function formatMetric(value: string): string {
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (ISO_DATE.test(text)) return formatDate(text);
  if (!PLAIN_NUMBER.test(text)) return value;
  const number = Number(text);
  if (!Number.isFinite(number) || Math.abs(number) < 10_000) return value;
  return compact.format(number);
}
