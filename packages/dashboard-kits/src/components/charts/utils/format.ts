import { formatCurrency, formatDuration, formatNumber } from "../../../core/format";
import type { ValueFormat } from "../../../core/schemas";

/** A value as a reader sees it in a label or tooltip: $48.2K, 3.4%, 3.93x, 6m 14s. */
export function formatValue(value: number, format: ValueFormat = "number"): string {
  if (!Number.isFinite(value)) return "—";
  if (format === "currency") return formatCurrency(value);
  if (format === "percent") return `${value.toFixed(Math.abs(value) < 10 && value % 1 ? 1 : 0)}%`;
  if (format === "ratio") return `${value.toFixed(2)}x`;
  if (format === "duration") return formatDuration(value);
  return formatNumber(value);
}

/** Compact axis labels: $40K, 1.2M, 25%, 4x, 6m. `extra` adds decimals to M and K. */
export function formatAxis(value: number, format: ValueFormat = "number", extra = 0): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  const compact =
    abs >= 1_000_000
      ? `${+(abs / 1_000_000).toFixed(1 + extra)}M`
      : abs >= 1_000
        ? `${+(abs / 1_000).toFixed((abs >= 10_000 ? 0 : 1) + extra)}K`
        : `${+abs.toFixed(abs < 10 && abs % 1 ? 1 : 0)}`;
  if (format === "currency") return `${sign}$${compact}`;
  if (format === "percent") return `${sign}${compact}%`;
  if (format === "ratio") return `${sign}${+abs.toFixed(1)}x`;
  if (format === "duration") return `${sign}${+abs.toFixed(abs < 10 ? 1 : 0)}m`;
  return `${sign}${compact}`;
}

/** Axis labels for a set of ticks, with just enough decimals that no two read the same. */
export function formatTicks(ticks: number[], format: ValueFormat = "number"): string[] {
  for (let extra = 0; extra < 3; extra++) {
    const labels = ticks.map((t) => formatAxis(t, format, extra));
    if (new Set(labels).size === labels.length) return labels;
  }
  return ticks.map((t) => formatAxis(t, format, 3));
}
