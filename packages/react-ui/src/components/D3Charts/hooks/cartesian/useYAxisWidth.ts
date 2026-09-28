import { scaleLinear } from "d3-scale";
import React, { useMemo } from "react";
import { measureYAxisWidth } from "../../utils/styleUtils";
import { computeYDomain } from "../../utils/yDomain";
import { useCanvasContextForLabelSize } from "../core/useCanvasContextForLabelSize";
import { useHydrated } from "../core/useHydrated";

const DEFAULT_Y_AXIS_WIDTH = 40;

/**
 * Width reserved for the y-axis labels.
 *
 * The axis only ever renders the scale's `.ticks()` — a handful of "nice" round
 * numbers — so we size against exactly those, via the shared `measureYAxisWidth`
 * helper (the scatter chart already sizes this way). Measuring every raw data
 * value instead, as this hook used to, is both wasteful (O(rows × series)
 * `measureText` calls) and wrong:
 *   - `.nice()` lifts the domain, so a data max of 950 yields a top tick of
 *     "1.0K" (4 chars) — wider than the raw "950" the old code measured, so the
 *     real tick label clipped.
 *   - fractional data (e.g. 47.38) formats to a string the axis never shows.
 *
 * The domain comes from the same `computeYDomain` the rendered scale uses —
 * stacked totals and negative extents included — so the measured labels are
 * the rendered ones by construction.
 */
export const useYAxisWidth = (
  data: Array<Record<string, string | number>>,
  dataKeys: string[],
  stacked: boolean,
  options?: {
    /**
     * The consumer's y-tick-count hint (the same `yTickCount` YAxis receives).
     * When present, YAxis renders `scale.ticks(clamped(hint))` — so measure
     * exactly that set. When absent, YAxis derives the count from the chart
     * height, which isn't known at measure time (height depends on the x-axis
     * band, which depends on THIS width via `availableWidth` — circular), so
     * we keep measuring d3's default tick set; the value strings differ only
     * marginally across counts for a nice'd domain.
     */
    tickCount?: number;
    /** The chart container — the measurement font's theme scope. */
    scopeRef?: React.RefObject<HTMLElement | null>;
  },
) => {
  const { tickCount, scopeRef } = options ?? {};
  const context = useCanvasContextForLabelSize(scopeRef);
  // Hydration gate (not a window check): the server renders the default
  // width, so the hydration render must too — measuring real text here
  // mismatched the SSR'd svg width/tick positions, and React leaves
  // mismatched attributes permanently stale.
  const hydrated = useHydrated();

  const yAxisWidth = useMemo(() => {
    if (!hydrated || !data || data.length === 0 || !dataKeys.length || !context) {
      return DEFAULT_Y_AXIS_WIDTH;
    }

    // Mirror useYScale's domain + .nice() so we measure exactly the ticks the
    // axis will render. The range (height) doesn't affect tick *values*, so we
    // can size before chart height is known (same trick the scatter chart uses).
    // The count mirrors resolveTickCount's override clamp (constants.ts).
    const scale = scaleLinear()
      .domain(computeYDomain(data, dataKeys, stacked))
      .nice();
    const ticks =
      tickCount != null && Number.isFinite(tickCount)
        ? scale.ticks(Math.max(2, Math.floor(tickCount)))
        : scale.ticks();
    return measureYAxisWidth(ticks, context);
  }, [hydrated, data, dataKeys, stacked, tickCount, context]);

  return { yAxisWidth };
};
