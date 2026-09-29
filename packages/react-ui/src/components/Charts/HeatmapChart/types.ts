import type { ChartData } from "../types";
import type { HeatmapRampMode } from "../utils/heatmapUtils";

export type HeatmapChartData = ChartData;

export interface HeatmapChartProps<T extends HeatmapChartData> {
  /**
   * Row-shaped data, same contract as the other charts: `categoryKey` names the
   * COLUMN (x-axis) label field; every other key of `data[0]` becomes a heatmap
   * ROW (y-axis); `row[key]` is the cell value. Non-numeric / missing cell
   * values render as muted "no value" cells.
   */
  data: T;
  categoryKey: keyof T[number];
  /**
   * Ordered color ramp for the value scale (low → high). Overrides the theme
   * palette. Otherwise the theme's `defaultChartPalette` (or the built-in
   * ocean ramp) is used in its given order.
   */
  customPalette?: string[];
  /**
   * How values map onto the ramp. Use `"diverging"` when values are signed
   * around a meaningful zero — profit/loss, deltas, correlation — so zero
   * sits on the neutral middle color and the two signs get opposing hues
   * (the domain is forced symmetric: ±max absolute value). `"sequential"`
   * (default) spreads the ramp over the plain min→max extent. With a
   * `customPalette`, diverging mode reads it as the full low→neutral→high
   * ramp (odd length keeps zero on one exact middle color).
   */
  rampMode?: HeatmapRampMode;
  /** Show the legend. Legend items are the rows; clicking toggles a row. Default true. */
  legend?: boolean;
  /**
   * Show the value→color key under the grid: a bucket strip labeled with the
   * domain's endpoints. Default true — the hover tooltip is mouse-only, so
   * without this strip a reader on touch or in print cannot map color to
   * magnitude at all. Turn off only when an outer surface provides its own
   * key.
   */
  showColorScale?: boolean;
  /**
   * Draw each cell's value inside the cell. Default false. Safe to enable on
   * any data: labels auto-hide per cell when the formatted value doesn't fit,
   * and text color auto-contrasts against each cell's color. Off in the
   * default because dense matrices read better through color alone.
   */
  showCellLabels?: boolean;
  /**
   * Play the entrance animation. Gates the entrance ONLY — any hover or
   * data-update motion is independent of this flag, and printing always
   * disables it.
   * Default false (streaming-safe: marks mounted while data streams in don't
   * replay staggered entrances).
   */
  isAnimationActive?: boolean;
  /** Show the row labels on the left. Default true. */
  showYAxis?: boolean;
  /** Gap between cells in px. Default 2. */
  cellGap?: number;
  /** Cell corner radius in px. Default 2. */
  cellRadius?: number;
  height?: number | string;
  width?: number | string;
  fitLegendInHeight?: boolean;
  className?: string;
  /** Click on a cell: the original data row (column), its index, and the row key. */
  onClick?: (row: T[number], columnIndex: number, rowKey: string) => void;
}
