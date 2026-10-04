import React, { useState } from "react";

import { resolveShouldFitLegend } from "../../utils/resolveShouldFitLegend";
import { useContainerSize } from "./useContainerSize";
import { useLegendHeight } from "./useLegendHeight";
import { usePrintContext } from "./usePrintContext";

interface UseChartShellParams {
  /** Row data; the default emptiness test is `!data || data.length === 0`. */
  data: readonly unknown[] | null | undefined;
  showLegend: boolean;
  /** Created by the orchestrator (it may own extra refs) and passed in. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  legendRef: React.RefObject<HTMLDivElement | null>;
  width?: number | string;
  height?: number | string;
  fitLegendInHeight?: boolean;
  /**
   * Override the default emptiness test. Heatmap is also empty when row 0 has
   * no series keys (`getDataKeys(...).length === 0`), which a row count alone
   * cannot see.
   */
  isEmptyOverride?: boolean;
}

/**
 * The measurement + emptiness + legend preamble shared by the five
 * non-cartesian orchestrators (funnel / scatter / heatmap / the categorical
 * pie & radial / radar). Owns the persistent container's measured size, the
 * empty-state flag, the legend-height deduction, and the legend-expanded
 * toggle.
 *
 * The container/legend refs are created BY the orchestrator and passed in — an
 * orchestrator may own extra refs (heatmap's color-scale strip) and must keep
 * them adjacent. `useCanvasContextForLabelSize` is deliberately NOT folded in:
 * only the three cartesian-geometry charts (funnel/scatter/heatmap) need it,
 * and the polar charts (categorical/radar) do not call it at all.
 */
export function useChartShell({
  data,
  showLegend,
  containerRef,
  legendRef,
  width,
  height,
  fitLegendInHeight,
  isEmptyOverride,
}: UseChartShellParams) {
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const isPrinting = usePrintContext();
  const { width: containerWidth, height: containerHeight } = useContainerSize(
    containerRef,
    width,
    height,
  );
  // Empty = placeholder instead of the chart. The measured container stays
  // mounted through this state (a stream's first frame is empty; unmounting the
  // observed node freezes ResizeObserver-fed sizes at 0 for the component's
  // life), but the legend DOES unmount — flipping its measurement toggle with
  // emptiness re-runs the observer effect against the remounted node.
  const isEmpty = isEmptyOverride ?? (!data || data.length === 0);
  const legendHeight = useLegendHeight(legendRef, showLegend && !isEmpty);
  const shouldFitLegend = resolveShouldFitLegend(fitLegendInHeight, height);

  return {
    isPrinting,
    containerWidth,
    containerHeight,
    isEmpty,
    legendHeight,
    shouldFitLegend,
    isLegendExpanded,
    setIsLegendExpanded,
  };
}
