export interface LegendItem {
  key: string;
  label: string;
  color: string;
  icon?: React.ComponentType;
  percentage?: number;
}

export type XAxisTickVariant = "singleLine" | "multiLine" | "angled";

export type ChartData = Array<Record<string, string | number>>;

export interface BaseChartProps<T extends ChartData> {
  data: T;
  categoryKey: keyof T[number];
  customPalette?: string[];
  /**
   * How the x-axis category labels are drawn. The label band never takes more
   * than half the chart's height. Scrolling charts widen their categories (to
   * at most three times the usual width, and at most half the chart) so the
   * labels show in full; labels that still don't fit, and labels in condensed
   * charts, are truncated with an ellipsis and show their full text on hover.
   * - `"singleLine"`: one horizontal line. Default when `condensed`.
   * - `"multiLine"`: wraps onto up to three lines. Default otherwise.
   * - `"angled"`: rotates labels 45° when they don't fit horizontally.
   *   `condensed` only; the scrolling layout draws it as `"singleLine"`.
   */
  tickVariant?: XAxisTickVariant;
  grid?: boolean;
  /**
   * Show the legend. NOTE: `xAxisLabel`/`yAxisLabel` render inside the legend
   * strip, so `legend={false}` hides them too.
   */
  legend?: boolean;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  /**
   * Play the entrance animation. Gates the entrance ONLY — any hover or
   * data-update motion is independent of this flag, and printing always
   * disables it.
   * Default false (streaming-safe: marks mounted while data streams in don't
   * replay staggered entrances).
   */
  isAnimationActive?: boolean;
  showYAxis?: boolean;
  /** Axis caption — rendered in the legend strip (hidden when `legend` is false). */
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  className?: string;
  height?: number | string;
  width?: number | string;
  /** When true, legend height is subtracted from container height so chart + legend
   *  fit within specified dimensions. Defaults to true when `height` is set, false otherwise. */
  fitLegendInHeight?: boolean;
  /** When true, all data fits within the container width (no scrolling). Default false. */
  condensed?: boolean;
  /** Controls spacing between data points in scrollable mode. Default "default". */
  density?: "compact" | "default" | "spacious";
  /**
   * Hint for the number of y-axis ticks (and the matching horizontal
   * gridlines — they share the y-scale, so this drives both in lockstep).
   * d3 treats it as a target and picks nice round values near it, so the
   * rendered count can differ from the number given; the value is floored at 2.
   * Default: derived from chart height (~1 tick per 40px).
   *
   * Vertical orientation only. The horizontal BarChart's value axis is the
   * X axis and ignores this prop for now.
   */
  yTickCount?: number;
}

/**
 * Toggles for the hover overlay on line/area charts. Each element toggles
 * independently: `activeDots` defaults `true`, while `crosshair` and `highlight`
 * default `false` (opt-in — the gliding line and the traveling curve highlight
 * are off unless asked for).
 * Plain booleans for now — they can widen to a config object
 * (e.g. `boolean | {...}`) later without breaking.
 */
export interface HoverOverlayProps {
  /** The vertical crosshair line that tracks the hovered x. Default `false` for
   *  Line/Area — pass `crosshair` to turn it on. */
  crosshair?: boolean;
  /** The highlight segment — a brighter slice of the curve that travels along it
   *  around the hovered point. Default `false` for Line/Area — pass `highlight`
   *  to turn it on. */
  highlight?: boolean;
  /** The dots that ride the curve at the hovered point, one per series. Distinct from
   *  the static series dots (`showDots`/`dotRadius`). Default `true`. */
  activeDots?: boolean;
}
