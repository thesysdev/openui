import React, { useMemo } from "react";

import { XAxisTickVariant } from "../../types";
import { MAX_LABEL_LINES, parseLineHeight, wrapLabelLines } from "../../utils/labelWrap";
import { useCanvasContextForLabelSize } from "../core/useCanvasContextForLabelSize";

const MIN_HEIGHT = 30;
const X_AXIS_LABEL_PADDING = 13;

/**
 * Height (px) to reserve for the x-axis label band.
 *
 * Single-line: one line + padding. Multi-line: the tallest wrapped label ×
 * line-height + padding. Uses the SAME `wrapLabelLines` the renderer (`XAxis`)
 * uses, so the reserved height always matches what gets drawn — replacing the
 * old `MAX_LABEL_LINES`↔`-webkit-line-clamp: 3` magic-number contract.
 *
 * (canvas measureText ignores letter-spacing — a pre-existing limitation shared
 * with useYAxisWidth and useMaxLabelWidth.)
 */
export const useXAxisHeight = (
  data: Record<string, string | number>[],
  categoryKey: string,
  tickVariant: XAxisTickVariant,
  widthOfGroup = 70,
  scopeRef?: React.RefObject<HTMLElement | null>,
) => {
  const context = useCanvasContextForLabelSize(scopeRef);

  return useMemo(() => {
    const lineHeight = parseLineHeight(context.font);
    // Single-line: 1 line of text + padding, floored at MIN_HEIGHT. Font-aware.
    const singleLineHeight = Math.max(lineHeight + X_AXIS_LABEL_PADDING, MIN_HEIGHT);

    if (tickVariant !== "multiLine") return singleLineHeight;
    if (!data || data.length === 0) return singleLineHeight;
    if (widthOfGroup <= 0) return singleLineHeight;

    let maxLines = 1;
    for (const item of data) {
      const label = String(item[categoryKey]);
      const lines = wrapLabelLines(context, label, widthOfGroup, MAX_LABEL_LINES).length;
      if (lines > maxLines) maxLines = lines;
    }

    const labelHeight = maxLines * lineHeight;
    return Math.max(labelHeight + X_AXIS_LABEL_PADDING, MIN_HEIGHT);
  }, [data, categoryKey, tickVariant, widthOfGroup, context]);
};
