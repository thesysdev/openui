import type { ScaleBand, ScalePoint } from "d3-scale";
import React from "react";

import { useCanvasContextForLabelSize } from "../../../hooks/core/useCanvasContextForLabelSize";
import type { XAxisTickVariant } from "../../../types";
import {
  MAX_LABEL_LINES,
  parseLineHeight,
  truncateToWidth,
  wrapLabelLines,
} from "../../../utils/labelWrap";
import { LabelTooltip } from "../../core/LabelTooltip/LabelTooltip";

const X_AXIS_TOP_GAP = 4;

type XAxisScale = ScalePoint<string> | ScaleBand<string>;

interface XAxisProps {
  scale: XAxisScale;
  tickVariant: XAxisTickVariant;
  widthOfGroup?: number;
  labelHeight: number;
  labelInterval?: number;
  /** Line cap for "multiLine" labels. */
  maxLines?: number;
  classPrefix: string;
}

function isBandScale(scale: XAxisScale): scale is ScaleBand<string> {
  return typeof (scale as ScaleBand<string>).paddingInner === "function";
}

/**
 * X-axis category labels as native SVG `<text>` (multi-line via `<tspan>`,
 * measured-trim ellipsis), matching the YAxis/CondensedXAxis. Native text — rather
 * than `<foreignObject>` HTML — so labels survive print/PDF and server-side
 * rasterization. A transparent `<rect>` provides the hover target for the
 * full-label tooltip when a label is truncated.
 */
export const XAxis: React.FC<XAxisProps> = ({
  scale,
  tickVariant,
  widthOfGroup,
  labelHeight,
  labelInterval = 1,
  maxLines = MAX_LABEL_LINES,
  classPrefix,
}) => {
  const ctx = useCanvasContextForLabelSize();
  const lineHeight = parseLineHeight(ctx.font);
  const domain = scale.domain();
  const band = isBandScale(scale);
  const labelWidth = band ? (scale as ScaleBand<string>).bandwidth() : (widthOfGroup ?? 0);

  return (
    <g className={`${classPrefix}-x-axis`}>
      {domain.map((category, i) => {
        const show = labelInterval <= 1 || i % labelInterval === 0 || i === domain.length - 1;
        if (!show) return null;

        const rawX = scale(category) ?? 0;
        const cx = band ? rawX + labelWidth / 2 : rawX;
        const label = String(category);

        const lines =
          tickVariant === "multiLine"
            ? wrapLabelLines(ctx, label, labelWidth, maxLines)
            : [truncateToWidth(ctx, label, labelWidth)];
        const truncated = lines.some((line) => line.endsWith("…"));

        const text = (
          <text
            x={cx}
            y={X_AXIS_TOP_GAP}
            textAnchor="middle"
            dominantBaseline="hanging"
            className={`${classPrefix}-x-tick`}
          >
            {lines.map((line, li) => (
              <tspan key={li} x={cx} dy={li === 0 ? 0 : lineHeight}>
                {line}
              </tspan>
            ))}
          </text>
        );

        return (
          <LabelTooltip key={category} content={label} disabled={!truncated}>
            <g>
              {truncated && (
                <rect
                  x={cx - labelWidth / 2}
                  y={0}
                  width={labelWidth}
                  height={labelHeight}
                  fill="transparent"
                />
              )}
              {text}
            </g>
          </LabelTooltip>
        );
      })}
    </g>
  );
};
