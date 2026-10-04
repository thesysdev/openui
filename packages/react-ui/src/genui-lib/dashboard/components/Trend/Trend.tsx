"use client";

import { defineComponent } from "@openuidev/react-lang";
import { trendPropsSchema, type TrendValue } from "./schema";

/**
 * Positional child component for metric trends — `Trend(direction, value)`
 * replaces the raw `{direction, value}` object literals the schemas used to
 * advertise. Data-only (renders nothing itself): the parent renderer
 * (MetricIndicator / OverviewCardItem / SmallCard) reads its props via
 * `resolveTrend`. Same `.ref` pattern as Select/SelectItem.
 */
export const TrendComponent = defineComponent({
  name: "Trend",
  props: trendPropsSchema,
  description:
    'Trend indicator child: Trend(direction, value). direction is "up" or "down"; value is the percent change as a number (Trend("up", 12.5) renders +12.5%). Pass as the trend argument of MetricIndicator, OverviewCardItem, or SmallCard.',
  component: () => null,
});

/**
 * Normalize a trend prop to `{direction, value}` — accepts BOTH shapes for
 * backward compatibility: a `Trend(...)` element node (reads `.props`) and the
 * legacy raw `{direction, value}` object. Returns undefined for anything that
 * doesn't resolve to a valid direction + finite numeric value.
 */
export function resolveTrend(input: unknown): TrendValue | undefined {
  if (input === null || typeof input !== "object") return undefined;
  const container = input as Record<string, unknown>;
  const candidate =
    typeof container["props"] === "object" && container["props"] !== null
      ? (container["props"] as Record<string, unknown>)
      : container;
  const direction = candidate["direction"];
  if (direction !== "up" && direction !== "down") return undefined;
  const raw = candidate["value"];
  const value =
    typeof raw === "number"
      ? raw
      : typeof raw === "string" && raw.trim() !== ""
        ? Number(raw)
        : NaN;
  if (!Number.isFinite(value)) return undefined;
  return { direction, value };
}
