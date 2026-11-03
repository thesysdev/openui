const PLAIN_NUMBER = /^-?\d+(\.\d+)?$/;

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/**
 * Shortens a metric that is a plain number: "1236752878" reads "1.2B",
 * "48496340" reads "48.5M", "69582" reads "69.6K". Anything else ("$1.2K",
 * "12%", "MIT") is shown as written. Numbers below 10,000 stay as they are, so
 * a year such as "2026" is not "2K".
 */
export function formatMetric(value: string): string {
  // A value that hasn't streamed in yet arrives as null.
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (!PLAIN_NUMBER.test(text)) return value;
  const number = Number(text);
  if (!Number.isFinite(number) || Math.abs(number) < 10_000) return value;
  return compact.format(number);
}
