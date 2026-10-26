// The formatters pick a unit from the value as it will print, so 999,999.99 is
// "$1.00M" rather than "$1000.0K", and 9,999.6 is "10.0K" rather than "10,000".
const printsAsMillions = (abs: number) => Number((abs / 1_000).toFixed(1)) >= 1_000;
const printsAsTenThousands = (abs: number) => Math.round(abs) >= 10_000;

export function formatCurrency(value: number): string {
  const sign = value < 0 ? "−" : "";
  const abs = Math.abs(value);
  const cents = Number.isInteger(abs) ? 0 : 2;
  if (printsAsMillions(abs)) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (printsAsTenThousands(abs)) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  if (Number(abs.toFixed(cents)) >= 1_000)
    return `${sign}$${Math.round(abs).toLocaleString("en-US")}`;
  return `${sign}$${abs.toLocaleString("en-US", { maximumFractionDigits: cents, minimumFractionDigits: cents })}`;
}

export function formatNumber(value: number): string {
  const sign = value < 0 ? "−" : "";
  const abs = Math.abs(value);
  if (printsAsMillions(abs)) return `${sign}${(abs / 1_000_000).toFixed(2)}M`;
  if (printsAsTenThousands(abs)) return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${Math.round(abs).toLocaleString("en-US")}`;
}

/** A ratio (0.123) as "12.3%". */
export function formatPercent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** A percent change (12.4) as "+12.4%". */
export function formatChange(change: number, digits = 1): string {
  return `${change >= 0 ? "+" : "−"}${Math.abs(change).toFixed(digits)}%`;
}

/** A change in percentage points (1.2) as "+1.2 pts". */
export function formatPoints(points: number, digits = 1): string {
  return `${points >= 0 ? "+" : "−"}${Math.abs(points).toFixed(digits)} pts`;
}

/** Minutes as "6m 12s", or hours and days when longer. */
export function formatDuration(minutes: number): string {
  // Whole seconds first, so 6.995 minutes is "7m 00s", not "6m 60s".
  const seconds = Math.round(Math.abs(minutes) * 60);
  const sign = minutes < 0 && seconds > 0 ? "−" : "";
  // Hours that would print as "24.0 h" are a day.
  if (Math.round(seconds / 360) >= 240) return `${sign}${(seconds / 86_400).toFixed(1)} days`;
  if (seconds >= 3_600) return `${sign}${(seconds / 3_600).toFixed(1)} h`;
  return `${sign}${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
}

export type Tone = "good" | "bad" | "neutral";

/** Whether a change is good news, given which direction is good for the metric. */
export function changeTone(
  change: number | undefined,
  goodDirection: "up" | "down" | "neutral" = "up",
): Tone {
  if (change == null || Math.abs(change) < 0.05 || goodDirection === "neutral") return "neutral";
  return change > 0 === (goodDirection === "up") ? "good" : "bad";
}
