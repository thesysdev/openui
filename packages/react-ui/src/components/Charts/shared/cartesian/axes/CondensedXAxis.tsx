import type { ScaleBand, ScalePoint } from "d3-scale";
import React from "react";

import { useCanvasContextForLabelSize } from "../../../hooks/core/useCanvasContextForLabelSize";
import { parseLineHeight, truncateToWidth, wrapLabelLines } from "../../../utils/labelWrap";
import { X_AXIS_TOP_GAP } from "../../../utils/xAxisLabelLayout";
import { LabelTooltip } from "../../core/LabelTooltip/LabelTooltip";

type CondensedXAxisScale = ScaleBand<string> | ScalePoint<string>;

function isBandScale(scale: CondensedXAxisScale): scale is ScaleBand<string> {
  return typeof (scale as ScaleBand<string>).paddingInner === "function";
}

interface CondensedXAxisProps {
  scale: CondensedXAxisScale;
  /** 0 draws horizontal labels; anything else rotates them by that many degrees. */
  angle: number;
  /** Draw every `labelInterval`-th label. */
  labelInterval: number;
  /** Horizontal: the box each label wraps/truncates to. Rotated: the longest text kept. */
  labelWidth: number;
  /** Line cap for wrapped horizontal labels (1 = single line). */
  maxLines: number;
  labelHeight: number;
  /** Width of the plot the axis spans. */
  chartWidth: number;
  /** Width of the y-axis to the axis' left — as far as rotated labels may reach. */
  yAxisWidth: number;
  classPrefix: string;
}

/**
 * The condensed (fit) x-axis. Labels are laid out by `layoutXAxisLabels`:
 * horizontal by default, rotated when `angle` is set, thinned to every n-th
 * label when categories are too narrow, and truncated with an ellipsis when
 * they don't fit — the full text shows on hover.
 */
export const CondensedXAxis: React.FC<CondensedXAxisProps> = ({
  scale,
  angle,
  labelInterval,
  labelWidth,
  maxLines,
  labelHeight,
  chartWidth,
  yAxisWidth,
  classPrefix,
}) => {
  const ctx = useCanvasContextForLabelSize();
  const lineHeight = parseLineHeight(ctx.font);
  const domain = scale.domain();
  const centerOf = (category: string) =>
    (scale(category) ?? 0) + (isBandScale(scale) ? scale.bandwidth() / 2 : 0);
  const isAngled = angle !== 0;

  return (
    <g className={`${classPrefix}-x-axis`}>
      {domain.map((category, i) => {
        if (i % labelInterval !== 0) return null;
        const label = String(category);
        const cx = centerOf(category);
        const y = X_AXIS_TOP_GAP;

        if (isAngled) {
          // A rotated label reaches `width · cos(angle)` left of its tick; near
          // the start of the axis it is truncated so it stays inside the chart.
          const reach = (cx + yAxisWidth) / Math.cos((angle * Math.PI) / 180);
          const text = truncateToWidth(ctx, label, Math.min(labelWidth, reach));
          const textWidth = ctx.measureText(text).width;
          const transform = `rotate(${angle}, ${cx}, ${y})`;
          return (
            <LabelTooltip key={category} content={label} disabled={text === label}>
              <g>
                {text !== label && (
                  <rect
                    x={cx - textWidth}
                    y={y}
                    width={textWidth}
                    height={lineHeight}
                    transform={transform}
                    fill="transparent"
                  />
                )}
                <text
                  x={cx}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="hanging"
                  className={`${classPrefix}-x-tick-angled`}
                  transform={transform}
                >
                  {text}
                </text>
              </g>
            </LabelTooltip>
          );
        }

        // Horizontal labels stay inside the plot's width: on a thinned axis a
        // label's box is wider than its category, so the first and last boxes
        // are cut at the ends (never shifted into their neighbours).
        const left = Math.max(0, cx - labelWidth / 2);
        const right = Math.min(chartWidth, cx + labelWidth / 2);
        const lines =
          maxLines > 1
            ? wrapLabelLines(ctx, label, right - left, maxLines)
            : [truncateToWidth(ctx, label, right - left)];
        const truncated = lines.some((line) => line.endsWith("…"));
        const half = Math.max(...lines.map((line) => ctx.measureText(line).width)) / 2;
        const x = Math.min(Math.max(cx, left + half), right - half);
        return (
          <LabelTooltip key={category} content={label} disabled={!truncated}>
            <g>
              {truncated && (
                <rect x={left} y={0} width={right - left} height={labelHeight} fill="transparent" />
              )}
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="hanging"
                className={`${classPrefix}-x-tick`}
              >
                {lines.map((line, li) => (
                  <tspan key={li} x={x} dy={li === 0 ? 0 : lineHeight}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          </LabelTooltip>
        );
      })}
    </g>
  );
};
