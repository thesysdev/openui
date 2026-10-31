import { useCallback, useState } from "react";

export function useSeriesVisibility(seriesKeys: string[]) {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const toggleSeries = useCallback(
    (key: string) => {
      setHiddenSeries((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          // At least one series stays visible. Count only hidden keys that
          // still exist in the CURRENT series — the set is never pruned on
          // data swaps, and counting stale keys could block hiding a series
          // that is visibly present.
          const hiddenCurrent = seriesKeys.filter((k) => next.has(k)).length;
          if (hiddenCurrent >= seriesKeys.length - 1) return prev;
          next.add(key);
        }
        return next;
      });
    },
    [seriesKeys],
  );

  return { hiddenSeries, toggleSeries };
}
