import React, { useMemo } from "react";

import type { ChartData } from "../../types";
import { parseLineHeight } from "../../utils/labelWrap";
import {
  layoutXAxisLabels,
  type XAxisLabelLayout,
  type XAxisLabelLayoutOptions,
} from "../../utils/xAxisLabelLayout";
import { useCanvasContextForLabelSize } from "../core/useCanvasContextForLabelSize";

/**
 * The x-axis label layout (`layoutXAxisLabels`) measured with the render-scope
 * tick font (`scopeRef` — see measureFontScope.ts).
 */
export const useXAxisLabelLayout = (
  data: ChartData,
  categoryKey: string,
  options: Omit<XAxisLabelLayoutOptions, "lineHeight">,
  scopeRef?: React.RefObject<HTMLElement | null>,
): XAxisLabelLayout => {
  const context = useCanvasContextForLabelSize(scopeRef);
  const { variant, slotWidth, maxHeight, condensed, visibleWidth, labelShare } = options;

  return useMemo(
    () =>
      layoutXAxisLabels(
        context,
        data.map((d) => String(d[categoryKey])),
        {
          variant,
          slotWidth,
          maxHeight,
          condensed,
          visibleWidth,
          labelShare,
          lineHeight: parseLineHeight(context.font),
        },
      ),
    [
      context,
      data,
      categoryKey,
      variant,
      slotWidth,
      maxHeight,
      condensed,
      visibleWidth,
      labelShare,
    ],
  );
};
