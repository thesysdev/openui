import type { ValueFormat } from "../../core/schemas";
import type { LegendItem } from "../shared";
import type { TrendChartSeries } from "../TrendChart/types";

export interface ColumnChartProps {
  /** One x label per column group, e.g. "Sep 11" or "Footwear". */
  labels: string[];
  /** Up to eight series, colored in the same fixed order as the trends. */
  series: TrendChartSeries[];
  /** How values read on the axis and in the tooltip. Default "number". */
  format?: ValueFormat;
  /**
   * Stack the series in each column instead of grouping them side by side.
   * Positive values stack up from zero and negative values down from it.
   */
  stacked?: boolean;
  /** Caption for the value axis, e.g. "Sales (USD)", shown above the plot. */
  yLabel?: string;
  /** Caption under the x labels, e.g. "Days active in the last 28 days". */
  xLabel?: string;
  /**
   * Per-column color overrides for a single series, e.g. power users in the
   * accent and everyone else in gray. Name the colors with `keys`.
   */
  columnColors?: (string | undefined)[];
  /** Static legend entries that replace the series legend. */
  keys?: LegendItem[];
  /** Plot height in px; with `fill`, the minimum. Default 240. */
  height?: number;
  /** Grow into the height of the surrounding card. */
  fill?: boolean;
  maxHeight?: number;
  /** Columns rise from the baseline on mount and glide on data changes. Default true. */
  isAnimationActive?: boolean;
  className?: string;
}
