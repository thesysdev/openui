import type { StackedLegendItem } from "./types";

/** Build legend items from the orchestrator's slices. Item key = slice label
 *  (the same key space hiddenSlices/toggleSlice already use). */
export const stackedItemsFromSlices = (
  slices: Array<{ label: string; value: number; color: string }>,
): StackedLegendItem[] =>
  slices.map((s) => ({
    key: s.label,
    label: s.label,
    color: s.color,
    value: s.value,
  }));

export const indexToKey = (
  slices: Array<{ label: string }>,
  index: number | null,
): string | null => (index == null ? null : (slices[index]?.label ?? null));

export const keyToIndex = (slices: Array<{ label: string }>, key: string | null): number | null => {
  if (key == null) return null;
  const i = slices.findIndex((s) => s.label === key);
  return i < 0 ? null : i;
};
