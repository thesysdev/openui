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
/** The scrolling layout grows a category to at most this many times `slotWidth`. */
const MAX_SLOT_GROWTH = 3;

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
  /**
   * Width of one category: `slotWidth`, or wider when the scrolling layout
   * grows it so the labels show in full.
   */
  slotWidth: number;
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
  /**
   * Scrolling layout only: the width of the visible plot. Categories widen so
   * that their labels show in full — wrapped between words into the lines the
   * band holds, or on one line for "singleLine" — instead of being truncated:
   * the chart scrolls further rather than cutting labels short. A category
   * grows to at most three times `slotWidth` and never past half the visible
   * plot, so at least two always show at once. A label that can't show in
   * full within that (a 60-character identifier, a paragraph) doesn't widen
   * the categories: it wraps mid-word and truncates as before. Omitted:
   * categories keep `slotWidth`.
   */
  visibleWidth?: number;
  /**
   * Scrolling layout only: the share of a category's width its label is drawn
   * in. Bar charts draw it under the bar's band (`1 − paddingInner` of the
   * band scale), line and area charts across the whole category. Default 1.
   */
  labelShare?: number;
}

/**
 * Whether `label` shows in full at `width`: on one line when `maxLines` is 1,
 * otherwise wrapped into at most `maxLines` lines without breaking a word.
 */
function fitsInFull(
  ctx: CanvasRenderingContext2D,
  label: string,
  width: number,
  maxLines: number,
): boolean {
  if (ctx.measureText(label).width <= width) return true;
  if (maxLines <= 1) return false;
  return (
    label.split(/\s+/).every((word) => ctx.measureText(word).width <= width) &&
    wrapLabelLines(ctx, label, width, Number.POSITIVE_INFINITY).length <= maxLines
  );
}

/**
 * The narrowest width at which `label` shows in full (see `fitsInFull`):
 * between the widest word and the whole label on one line.
 */
export function fullLabelWidth(
  ctx: CanvasRenderingContext2D,
  label: string,
  maxLines: number,
): number {
  const oneLine = ctx.measureText(label).width;
  if (maxLines <= 1) return oneLine;
  const widestWord = Math.max(0, ...label.split(/\s+/).map((word) => ctx.measureText(word).width));
  return narrowestFullWidth(ctx, label, maxLines, widestWord, oneLine);
}

/**
 * The narrowest width in `[lo, hi]` at which `label` shows in full, given that
 * it does at `hi`. Greedy wrapping never needs more lines at a larger width,
 * so this bisects, then snaps to the widest line of the wrap it found: the
 * wrap is the same at that width, so the result is an exact text width
 * whatever the search bounds.
 */
function narrowestFullWidth(
  ctx: CanvasRenderingContext2D,
  label: string,
  maxLines: number,
  lo: number,
  hi: number,
): number {
  if (fitsInFull(ctx, label, lo, maxLines)) return lo;
  while (hi - lo > 0.5) {
    const mid = (lo + hi) / 2;
    if (fitsInFull(ctx, label, mid, maxLines)) hi = mid;
    else lo = mid;
  }
  const lines = wrapLabelLines(ctx, label, hi, Number.POSITIVE_INFINITY);
  return Math.max(...lines.map((line) => ctx.measureText(line).width));
}

/**
 * Lays out the x-axis category labels inside a band capped at `maxHeight`.
 * The band never grows past the cap. The condensed layout truncates labels
 * that don't fit it with an ellipsis (the renderer shows the full text on
 * hover); the scrolling layout first widens its categories (see
 * `visibleWidth`) so the labels show in full.
 */
export function layoutXAxisLabels(
  ctx: CanvasRenderingContext2D,
  labels: string[],
  {
    variant,
    slotWidth: minSlotWidth,
    maxHeight,
    lineHeight,
    condensed,
    visibleWidth = 0,
    labelShare = 1,
  }: XAxisLabelLayoutOptions,
): XAxisLabelLayout {
  const singleLineHeight = Math.max(lineHeight + X_AXIS_LABEL_PADDING, MIN_X_AXIS_HEIGHT);
  // One line of text always gets room, even in a chart too short to honour the cap.
  const cap = Math.max(singleLineHeight, Math.floor(maxHeight));
  const lineCap = Math.max(
    1,
    Math.min(MAX_LABEL_LINES, Math.floor((cap - X_AXIS_LABEL_PADDING) / lineHeight)),
  );

  // Scrolling: widen the categories until every label shows in full.
  let slotWidth = minSlotWidth;
  if (!condensed && labels.length > 0 && visibleWidth > minSlotWidth) {
    const maxSlotWidth = Math.max(
      minSlotWidth,
      Math.min(MAX_SLOT_GROWTH * minSlotWidth, visibleWidth / 2),
    );
    const lines = variant === "multiLine" ? lineCap : 1;
    const floor = minSlotWidth * labelShare;
    const ceiling = maxSlotWidth * labelShare;
    // The widest label that can show in full under the ceiling sets the width.
    // Only a label that raises it is searched for its exact width; any other
    // label costs a check or two (it fits the width found so far, or can't fit
    // even at the ceiling), so long category lists stay cheap to lay out on
    // every streamed update.
    let needed = floor;
    for (const label of new Set(labels)) {
      if (fitsInFull(ctx, label, needed, lines) || !fitsInFull(ctx, label, ceiling, lines)) {
        continue;
      }
      const oneLine = ctx.measureText(label).width;
      needed =
        lines <= 1
          ? oneLine
          : narrowestFullWidth(ctx, label, lines, needed, Math.min(ceiling, oneLine));
    }
    if (needed > floor) {
      const tight = Math.ceil(needed / labelShare);
      // Leave a gap between neighbouring labels (line and area labels span the
      // whole category), but never one that makes a chart that fits scroll.
      const unscrolled = visibleWidth / labels.length;
      const roomy =
        tight <= unscrolled ? Math.min(tight + LABEL_GAP, unscrolled) : tight + LABEL_GAP;
      slotWidth = Math.min(maxSlotWidth, Math.max(minSlotWidth, roomy));
    }
  }

  const singleLine: XAxisLabelLayout = {
    angle: 0,
    interval: 1,
    labelWidth: condensed ? slotWidth : slotWidth * labelShare,
    maxLines: 1,
    height: singleLineHeight,
    slotWidth,
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
    return { angle: ANGLED_LABEL_ROTATION, interval, labelWidth, maxLines: 1, height, slotWidth };
  }

  let interval = 1;
  let labelWidth = singleLine.labelWidth;
  if (condensed) {
    const minWidth = Math.min(widest, MIN_LABEL_WIDTH) + LABEL_GAP;
    interval = Math.min(labels.length, Math.max(1, Math.ceil(minWidth / slotWidth)));
    labelWidth = slotWidth * interval - LABEL_GAP;
  }
  if (variant !== "multiLine") return { ...singleLine, interval, labelWidth };

  let lines = 1;
  labels.forEach((label, i) => {
    if (i % interval !== 0) return;
    lines = Math.max(lines, wrapLabelLines(ctx, label, labelWidth, lineCap).length);
  });
  const height = Math.max(lines * lineHeight + X_AXIS_LABEL_PADDING, MIN_X_AXIS_HEIGHT);
  return { angle: 0, interval, labelWidth, maxLines: lines, height, slotWidth };
}
