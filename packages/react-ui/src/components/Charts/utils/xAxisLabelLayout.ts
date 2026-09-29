import type { XAxisTickVariant } from "../types";
import { MAX_LABEL_LINES, wrapLabelLines } from "./labelWrap";

/**
 * The x-axis label band never takes more than this share of the chart's
 * drawable height, so the plot always keeps the rest. Labels that don't fit
 * are truncated instead of growing the band.
 */
export const MAX_X_AXIS_HEIGHT_SHARE = 0.5;

/** Gap between the plot's bottom edge and the labels. */
export const X_AXIS_TOP_GAP = 4;

/** Rotation for "angled" labels that don't fit horizontally. */
export const ANGLED_LABEL_ROTATION = -45;

const X_AXIS_LABEL_PADDING = 13;
const MIN_X_AXIS_HEIGHT = 30;
/** Horizontal space kept between neighbouring labels in the condensed layout. */
const LABEL_GAP = 8;
/**
 * The narrowest box a horizontal condensed label is truncated into. When a
 * category is narrower than this, only every n-th label is drawn so each one
 * still has room for a few characters.
 */
const MIN_LABEL_WIDTH = 40;

export interface XAxisLabelLayout {
  /** 0 for horizontal labels, `ANGLED_LABEL_ROTATION` for rotated ones. */
  angle: number;
  /** Draw every `interval`-th label (1 = every label). */
  interval: number;
  /**
   * Horizontal labels: the width each drawn label wraps or truncates to.
   * Rotated labels: the longest text a label keeps before truncating.
   */
  labelWidth: number;
  /** Lines the band holds; wrapped ("multiLine") labels truncate past it. */
  maxLines: number;
  /** Height of the label band. */
  height: number;
}

export interface XAxisLabelLayoutOptions {
  variant: XAxisTickVariant;
  /** Width of one category on the x-axis. */
  slotWidth: number;
  /** The most height the label band may take. */
  maxHeight: number;
  lineHeight: number;
  /**
   * The condensed layout: every category shares the container width, so
   * labels may be thinned, rotated ("angled") and get a gap between them. The
   * scrolling layout draws every label at its category width.
   */
  condensed: boolean;
}

/**
 * Lays out the x-axis category labels inside a band capped at `maxHeight`.
 * The band never grows past the cap; labels that don't fit it are truncated
 * with an ellipsis (the renderer shows the full text on hover).
 */
export function layoutXAxisLabels(
  ctx: CanvasRenderingContext2D,
  labels: string[],
  { variant, slotWidth, maxHeight, lineHeight, condensed }: XAxisLabelLayoutOptions,
): XAxisLabelLayout {
  const singleLineHeight = Math.max(lineHeight + X_AXIS_LABEL_PADDING, MIN_X_AXIS_HEIGHT);
  // One line of text always gets room, even in a chart too short to honour the cap.
  const cap = Math.max(singleLineHeight, Math.floor(maxHeight));
  const singleLine: XAxisLabelLayout = {
    angle: 0,
    interval: 1,
    labelWidth: slotWidth,
    maxLines: 1,
    height: singleLineHeight,
  };
  if (labels.length === 0 || slotWidth <= 0) return singleLine;

  const widest = Math.max(...labels.map((label) => ctx.measureText(label).width));

  if (condensed && variant === "angled" && widest > slotWidth - LABEL_GAP) {
    const sin = Math.sin((Math.abs(ANGLED_LABEL_ROTATION) * Math.PI) / 180);
    // Neighbouring rotated labels are `slotWidth · sin` apart, measured across
    // the text; below one line-height they would overlap, so thin them.
    const interval = Math.max(1, Math.ceil(lineHeight / sin / slotWidth));
    // A rotated label of text width L spans (L + lineHeight) · sin vertically.
    const needed = Math.ceil((widest + lineHeight) * sin) + X_AXIS_TOP_GAP;
    const height = Math.min(cap, Math.max(singleLineHeight, needed));
    const labelWidth = Math.max(0, (height - X_AXIS_TOP_GAP) / sin - lineHeight);
    return { angle: ANGLED_LABEL_ROTATION, interval, labelWidth, maxLines: 1, height };
  }

  let interval = 1;
  let labelWidth = slotWidth;
  if (condensed) {
    const minWidth = Math.min(widest, MIN_LABEL_WIDTH) + LABEL_GAP;
    interval = Math.min(labels.length, Math.max(1, Math.ceil(minWidth / slotWidth)));
    labelWidth = slotWidth * interval - LABEL_GAP;
  }
  if (variant !== "multiLine") return { ...singleLine, interval, labelWidth };

  const lineCap = Math.max(
    1,
    Math.min(MAX_LABEL_LINES, Math.floor((cap - X_AXIS_LABEL_PADDING) / lineHeight)),
  );
  let lines = 1;
  labels.forEach((label, i) => {
    if (i % interval !== 0) return;
    lines = Math.max(lines, wrapLabelLines(ctx, label, labelWidth, lineCap).length);
  });
  const height = Math.max(lines * lineHeight + X_AXIS_LABEL_PADDING, MIN_X_AXIS_HEIGHT);
  return { angle: 0, interval, labelWidth, maxLines: lines, height };
}
