import React, { useCallback, useEffect, useState } from "react";

import { findNearestSnapPosition, getSnapPositions } from "../../utils/scrollUtils";

import type { ChartData } from "../../types";

export interface UseChartScrollParams<T extends ChartData> {
  mainContainerRef: React.RefObject<HTMLDivElement | null>;
  data: T;
  needsScroll: boolean;
  /** Width of one category group; the scroll buttons step one group at a time. */
  widthOfGroup: number;
}

export function useChartScroll<T extends ChartData>({
  mainContainerRef,
  data,
  needsScroll,
  widthOfGroup,
}: UseChartScrollParams<T>) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(needsScroll);

  useEffect(() => {
    if (!needsScroll) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const el = mainContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 1);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    } else {
      setCanScrollRight(true);
    }
  }, [needsScroll, mainContainerRef]);

  const handleScroll = useCallback(() => {
    const el = mainContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, [mainContainerRef]);

  const scrollTo = useCallback(
    (direction: "left" | "right") => {
      const el = mainContainerRef.current;
      if (!el) return;
      const snaps = getSnapPositions(data, widthOfGroup);
      const idx = findNearestSnapPosition(snaps, el.scrollLeft, direction);
      const target = snaps[idx] ?? 0;
      el.scrollTo({ left: target, behavior: "smooth" });
    },
    [data, mainContainerRef, widthOfGroup],
  );

  return {
    canScrollLeft,
    canScrollRight,
    handleScroll,
    scrollTo,
  };
}
