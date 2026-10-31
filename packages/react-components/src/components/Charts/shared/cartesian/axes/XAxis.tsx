"use client";

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
/** Space kept between neighbouring labels on a thinned axis. */
const THINNED_LABEL_GAP = 8;

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
  classes?: Partial<Record<"xAxis" | "group" | "hitTarget" | "tickLine", string>>;
  tickClassName?: string;
  angledTickClassName?: string;
  /** Flat classes supplied by a migrated chart; legacy callers keep their prefix. */
  partClassNames?: Partial<Record<"root" | "tick" | "textLine" | "group" | "hitbox", string>>;
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
  classes,
  tickClassName,
  partClassNames,
}) => {
  const ctx = useCanvasContextForLabelSize();
  const lineHeight = parseLineHeight(ctx.font);
  const domain = scale.domain();
  const band = isBandScale(scale);
  const bandWidth = band ? (scale as ScaleBand<string>).bandwidth() : (widthOfGroup ?? 0);
  const step = band ? (scale as ScaleBand<string>).step() : (widthOfGroup ?? 0);
  const shown = domain
    .map((_, i) => i)
    .filter((i) => labelInterval <= 1 || i % labelInterval === 0 || i === domain.length - 1);
  // The last label is always shown; a regular label too close before it makes
  // way, so neither is squeezed.
  if (labelInterval > 1 && shown.length > 2) {
    const [prev, last] = shown.slice(-2) as [number, number];
    if (last - prev < labelInterval) shown.splice(-2, 1);
  }
  // On a thinned axis a label may use the room up to its nearest shown
  // neighbour, not just its own category.
  const labelWidthAt = (pos: number) => {
    if (labelInterval <= 1) return bandWidth;
    const i = shown[pos]!;
    const gaps = [shown[pos - 1], shown[pos + 1]]
      .filter((n): n is number => n !== undefined)
      .map((n) => Math.abs(n - i));
    const span = gaps.length ? Math.min(...gaps) : 1;
    return Math.max(bandWidth, step * span - THINNED_LABEL_GAP);
  };

  return (
    <g className={classes?.xAxis ?? partClassNames?.root ?? `${classPrefix}-x-axis`}>
      {shown.map((i, pos) => {
        const category = domain[i]!;
        const labelWidth = labelWidthAt(pos);
        const rawX = scale(category) ?? 0;
        const cx = band ? rawX + bandWidth / 2 : rawX;
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
            className={tickClassName ?? partClassNames?.tick ?? `${classPrefix}-x-tick`}
          >
            {lines.map((line, li) => (
              <tspan
                className={classes?.tickLine ?? partClassNames?.textLine}
                key={li}
                x={cx}
                dy={li === 0 ? 0 : lineHeight}
              >
                {line}
              </tspan>
            ))}
          </text>
        );

        return (
          <LabelTooltip key={category} content={label} disabled={!truncated}>
            <g className={classes?.group ?? partClassNames?.group}>
              {truncated && (
                <rect
                  className={classes?.hitTarget ?? partClassNames?.hitbox}
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
