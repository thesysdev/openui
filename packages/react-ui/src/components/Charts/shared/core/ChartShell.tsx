import clsx from "clsx";
import React from "react";

import { MeasureFontScopeContext } from "../../hooks/core/measureFontScope";
import { CHART_CLASS_PREFIX } from "../../utils/constants";
import { LabelTooltipProvider } from "./LabelTooltip/LabelTooltip";

interface ChartShellProps {
  containerRef: React.Ref<HTMLDivElement>;
  /** e.g. `${CHART_CLASS_PREFIX}-pie-chart` → the persistent div gets `${classPrefix}-container`. */
  classPrefix: string;
  /** The consumer's passthrough `className`. */
  className?: string;
  style: React.CSSProperties;
  isEmpty: boolean;
  /**
   * The PPTX print-export JSON (from `useExportChartData`) for the persistent
   * container's `data-openui-chart` attribute. Set only on
   * the print path (Pie/Radial/HorizontalBar pass it); `undefined` otherwise,
   * so React omits the attribute entirely and the six charts that never pass
   * it are unchanged.
   */
  exportData?: string;
  /**
   * The chart content, as a render function so it is constructed ONLY when not
   * empty — mirroring the inline `isEmpty ? <span/> : <>…</>` ternary it
   * replaces (which never built the content branch on an empty frame).
   */
  children: () => React.ReactNode;
}

/**
 * The persistent-container shell shared by the six non-cartesian charts
 * (pie / radial / radar / scatter / heatmap / funnel).
 *
 * The div is measured by a ResizeObserver and MUST NOT unmount: the empty state
 * swaps the div's CONTENT (a "No data" span ↔ the chart), never the div itself.
 * Unmounting it on an empty stream frame would leave the observer reporting a
 * final 0×0 with the replacement node never re-observed — freezing the chart at
 * zero size for the rest of its life. The cartesian charts dodge this with a
 * hook-free wrapper guard instead; the two empty-state strategies are
 * deliberately separate — do not merge them.
 */
export const ChartShell: React.FC<ChartShellProps> = ({
  containerRef,
  classPrefix,
  className,
  style,
  isEmpty,
  exportData,
  children,
}) => (
  <LabelTooltipProvider>
    {/* Measurement-font scope: children measuring text (axis label sheets,
        legend) resolve the tick font from THIS container's computed style —
        the render channel — rather than the JS theme context. Callback refs
        can't be dereferenced, so they get no scope (theme fallback applies);
        every in-repo chart passes a useRef object. */}
    <MeasureFontScopeContext.Provider
      value={typeof containerRef === "object" ? containerRef : null}
    >
      <div
        ref={containerRef}
        className={clsx(
          `${classPrefix}-container`,
          isEmpty && `${CHART_CLASS_PREFIX}-chart-empty`,
          className,
        )}
        style={style}
        // PPTX-exporter contract attribute — not derived from the class prefix.
        data-openui-chart={exportData}
      >
        {isEmpty ? (
          <span className={`${CHART_CLASS_PREFIX}-chart-empty-text`}>No data available</span>
        ) : (
          children()
        )}
      </div>
    </MeasureFontScopeContext.Provider>
  </LabelTooltipProvider>
);
