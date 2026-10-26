import type { WaterfallKind } from "./types";

/** Where a step's bar sits in value space, and the running total after it. */
export interface WaterfallSpan {
  from: number;
  to: number;
  level: number;
}

/**
 * Floating bars for a running total: base and total steps stand on zero (a
 * total restates the running amount), add steps rise from the running total,
 * and subtract steps hang down from it.
 */
export function waterfallSpans(steps: { value: number; kind: WaterfallKind }[]): WaterfallSpan[] {
  let running = 0;
  return steps.map(({ value, kind }) => {
    const v = Math.abs(value);
    let start = 0;
    if (kind === "add") {
      start = running;
      running += v;
    } else if (kind === "subtract") {
      start = running;
      running -= v;
    } else {
      running = value;
    }
    return { from: Math.min(start, running), to: Math.max(start, running), level: running };
  });
}

/** Values per step in the morph vector: bar top and bottom, outline top and bottom, level. */
export const WATERFALL_STRIDE = 5;

/**
 * The pixel geometry of every bar, comparison outline, and connector level as
 * one flat vector the data morph can spring. Steps without a comparison get a
 * zero-height outline on their bar's level, so the vector keeps its length.
 */
export function packWaterfall(
  spans: WaterfallSpan[],
  comparison: WaterfallSpan[] | undefined,
  y: (value: number) => number,
): Float64Array {
  const out = new Float64Array(spans.length * WATERFALL_STRIDE);
  spans.forEach((span, i) => {
    const ghost = comparison?.[i] ?? { from: span.level, to: span.level };
    out.set(
      [y(span.to), y(span.from), y(ghost.to), y(ghost.from), y(span.level)],
      i * WATERFALL_STRIDE,
    );
  });
  return out;
}

export interface WaterfallBar {
  top: number;
  bottom: number;
  ghostTop: number;
  ghostBottom: number;
  level: number;
}

export function unpackWaterfall(values: ArrayLike<number>, count: number): WaterfallBar[] {
  return Array.from({ length: count }, (_, i) => {
    const o = i * WATERFALL_STRIDE;
    return {
      top: values[o]!,
      bottom: values[o + 1]!,
      ghostTop: values[o + 2]!,
      ghostBottom: values[o + 3]!,
      level: values[o + 4]!,
    };
  });
}

/**
 * Whether a step beat its comparison: more is better for amounts that add to
 * profit, less is better for costs.
 */
export function varianceTone(
  kind: WaterfallKind,
  value: number,
  comparison: number | undefined,
): "good" | "bad" | "neutral" {
  if (comparison == null || value === comparison) return "neutral";
  const more = value > comparison;
  return more === (kind !== "subtract") ? "good" : "bad";
}

/**
 * Which tick labels to draw along a horizontal value axis so none collide:
 * walking from the left, a centred label is kept only when it clears the last
 * one kept. The gridlines all stay; only crowded labels drop.
 */
export function spacedTickLabels(
  positions: number[],
  labels: string[],
  charWidth = 6.6,
  gap = 6,
): boolean[] {
  let lastRight = Number.NEGATIVE_INFINITY;
  return positions.map((x, i) => {
    const half = ((labels[i] ?? "").length * charWidth) / 2;
    if (x - half < lastRight + gap) return false;
    lastRight = x + half;
    return true;
  });
}

/** Approximate advance of a row label character (11.5px, semibold for totals). */
const ROW_LABEL_CHAR = 6;

/**
 * The left margin for row layout: room for the longest step name, at least
 * the usual 40% of the width (up to 150px), and never more than half of it.
 */
export function rowLabelMargin(stepLabels: string[], width: number): number {
  const longest = Math.max(0, ...stepLabels.map((l) => l.length));
  const usual = Math.min(150, Math.round(width * 0.4));
  return Math.min(
    Math.round(width * 0.5),
    Math.max(usual, Math.ceil(longest * ROW_LABEL_CHAR) + 14),
  );
}
