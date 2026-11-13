import { MUTED_COLOR } from "../../../shared/colors";
import type { TooltipRow } from "./TooltipCard";

/** A part's tooltip rows: its share now, with the change in points, and last period's share as a dashed row. */
export function shareRows(
  color: string,
  now: number,
  before: number | null,
  compareLabel: string,
): TooltipRow[] {
  return [
    { name: "Share", color, value: now, previous: before },
    ...(before !== null
      ? [{ name: compareLabel, color: MUTED_COLOR, value: before, dashed: true }]
      : []),
  ];
}
