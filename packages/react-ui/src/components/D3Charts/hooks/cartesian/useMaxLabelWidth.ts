import React, { useMemo } from "react";

import { useCanvasContextForLabelSize } from "../core/useCanvasContextForLabelSize";

/**
 * Measures the pixel width of each category label and returns the maximum width found.
 * Uses a canvas context to accurately measure text dimensions based on the
 * render-scope font (`scopeRef` — see measureFontScope.ts).
 */
export const useMaxLabelWidth = <T extends Record<string, any>>(
  data: T[],
  categoryKey: keyof T,
  scopeRef?: React.RefObject<HTMLElement | null>,
): number => {
  const context = useCanvasContextForLabelSize(scopeRef);

  return useMemo(() => {
    if (!data || data.length === 0) {
      return 0;
    }

    let maxWidth = 0;

    for (const item of data) {
      const labelValue = String(item[categoryKey] ?? "");
      const metrics = context.measureText(labelValue);
      const width = metrics.width;

      if (width > maxWidth) {
        maxWidth = width;
      }
    }

    return maxWidth;
  }, [data, categoryKey, context]);
};
