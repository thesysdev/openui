import React, { useEffect, useState } from "react";

/**
 * Observed height of a legend-like element below the chart.
 *
 * `showLegend` is the ONLY live dependency — `legendRef` is a stable useRef
 * object, so the effect cannot see the element being swapped for a new node.
 * Consumers that conditionally UNMOUNT the measured element (e.g. charts
 * hiding their legend while data is empty) must therefore flip `showLegend`
 * in lockstep (`show && !isEmpty`): the flip re-runs the effect, which
 * re-observes whatever node is mounted by then. Without the flip, the
 * observer would stay on the detached node and the height would go stale.
 */
export function useLegendHeight(
  legendRef: React.RefObject<HTMLDivElement | null>,
  showLegend: boolean,
): number {
  const [legendHeight, setLegendHeight] = useState(0);

  useEffect(() => {
    const el = legendRef.current;
    if (!el) {
      setLegendHeight(0);
      return;
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setLegendHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    setLegendHeight(el.getBoundingClientRect().height);
    return () => observer.disconnect();
  }, [showLegend, legendRef]);

  return legendHeight;
}
