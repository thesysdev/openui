import type { Band, ChartEvent, Target, ValueFormat } from "../../../core/schemas";

export interface TrendChartSeries {
  name: string;
  values: number[];
  /** `primary` draws in the accent with an area wash; `muted` is dotted gray context. */
  emphasis?: "primary" | "muted";
  /** Overrides the series color the chart would assign. */
  color?: string;
  /** A status color instead of a categorical one: good, warning, or bad. */
  tone?: "good" | "warn" | "bad";
  dashed?: boolean;
}

/** Which direction is good for the metric, so the gap shades in the right tone. */
export type TrendCompareDirection = "up" | "down" | "neutral";

export interface TrendChartProps {
  /** One x label per point, e.g. "Sep 11". */
  labels: string[];
  /** Up to four series, colored in a fixed order; a muted series is context. */
  series: TrendChartSeries[];
  format?: ValueFormat;
  /** `area` washes the primary series; `line` labels every strong series at its end. */
  variant?: "area" | "line";
  /** Shaded spans (a sale, a holiday) with an optional detail for the tooltip. */
  events?: ChartEvent[];
  /** A goal or limit, drawn as a dashed line and named in the legend. */
  target?: Target;
  /** A healthy or benchmark range, shaded behind the lines and named in the legend. */
  band?: Band;
  /** The last point is still in progress: its segment is dotted, its dot hollow. */
  partial?: boolean;
  /**
   * Shade the gap between the primary series and the muted comparison: in the
   * good tone where the primary is ahead in the good direction, bad where behind.
   */
  compare?: TrendCompareDirection;
  /** Plot height in px; with `fill`, the minimum. Default 220. */
  height?: number;
  /** Grow into the height of the surrounding card. */
  fill?: boolean;
  /** The most a filling plot grows to. */
  maxHeight?: number;
  /** Show the legend (two or more series). Default true. */
  legend?: boolean;
  /**
   * Glide between data states (a filter or a selected KPI changing the data)
   * with the spring data morph. The first render and reduced motion snap.
   * Default true.
   */
  isAnimationActive?: boolean;
  className?: string;
}
