import type { TrackerItem } from "../../../core/schemas";

/** Status names as the legend and tooltips read them. */
export const TRACKER_STATUS_LABEL: Record<TrackerItem["status"], string> = {
  good: "Met target",
  warn: "Just under",
  bad: "Missed",
  none: "No data",
};

const ORDER: TrackerItem["status"][] = ["good", "warn", "bad", "none"];

/**
 * How many blocks have each status, in legend order, leaving out statuses with
 * none. A status whose blocks all share one detail ("Alerting", "Clear") is
 * named by it; otherwise by the default name.
 */
export function statusCounts(items: TrackerItem[]) {
  return ORDER.map((status) => {
    const mine = items.filter((item) => item.status === status);
    const details = new Set(mine.map((item) => item.detail));
    const shared = details.size === 1 ? [...details][0] : undefined;
    return { status, label: shared ?? TRACKER_STATUS_LABEL[status], count: mine.length };
  }).filter((entry) => entry.count > 0);
}
