import type { ValueFormat } from "../../../core/schemas";

export type WaterfallKind = "base" | "add" | "subtract" | "total";

export interface WaterfallStep {
  label: string;
  /** Amount, always positive for add and subtract; `kind` says how it combines. */
  value: number;
  kind: WaterfallKind;
  /** The same step in the comparison (plan, prior period, last year). */
  comparison?: number;
}

export interface ProfitWaterfallProps {
  steps: WaterfallStep[];
  /** What the dashed outlines stand for, e.g. "Plan" or "Prior 30 days". */
  comparisonLabel?: string;
  format?: ValueFormat;
  /**
   * Start the value axis at zero (default). A variance walk turns this off so
   * small steps between two large totals stay visible; its totals then stand
   * on the bottom of the plot.
   */
  zero?: boolean;
  /** Plot height in px. Default 240. */
  height?: number;
  /**
   * Grow the columns to the card's height when a taller card beside it
   * stretches the row, up to `maxHeight`. Rows (narrow cards) keep their size.
   */
  fill?: boolean;
  /** The tallest a filling plot grows, in px. */
  maxHeight?: number;
  /** Bars rise in on first show and glide when the data changes. Default true. */
  isAnimationActive?: boolean;
  className?: string;
}
