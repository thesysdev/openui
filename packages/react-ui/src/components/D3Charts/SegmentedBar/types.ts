import type { CSSProperties } from "react";
import type { ChartData } from "../types";

export type SegmentedBarData = ChartData;

export interface SegmentedBarProps<T extends SegmentedBarData> {
  /**
   * Row-shaped data, same contract as Pie/Radial/Funnel: one row per segment,
   * in display order. `categoryKey` names the segment-label field; `dataKey`
   * names the numeric value field. Each segment is sized by its SHARE OF THE
   * TOTAL (value / Σ of all values).
   */
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  /** Ordered colors for the segments (by input order); overrides the theme palette. */
  customPalette?: string[];
  /** Show the legend (one row per segment). Default true. */
  legend?: boolean;
  /**
   * `'stacked'` (default) → a `StackedLegend` under the bar (label + value per
   * row, hovering a row highlights its segment). `'default'` → a `Separator`
   * plus the compact swatch `DefaultLegend`.
   */
  legendVariant?: "default" | "stacked";
  /**
   * Animate the bar's width transitions (each segment tweens as its share
   * shifts — e.g. as data streams in). Printing always disables it. Default
   * false (streaming-safe).
   */
  isAnimationActive?: boolean;
  className?: string;
  style?: CSSProperties;
}
