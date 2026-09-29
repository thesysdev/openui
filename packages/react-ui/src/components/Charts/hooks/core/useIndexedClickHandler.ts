import { useCallback } from "react";

/**
 * The click handler shared by the single-element painters (pie / radial /
 * funnel): map a clicked element's index back to its data item and forward it.
 * No-ops when `onClick` is absent. (The heatmap's handler is 3-arg —
 * row/column/key — and stays bespoke.)
 */
export function useIndexedClickHandler<T>(
  items: T[],
  onClick?: (item: T, index: number) => void,
): (index: number) => void {
  return useCallback((index: number) => onClick?.(items[index]!, index), [onClick, items]);
}
