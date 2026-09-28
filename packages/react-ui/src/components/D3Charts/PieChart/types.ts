import type { ChartData } from "../types";

export type PieChartData = ChartData;

export interface PieChartProps<T extends PieChartData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  customPalette?: string[];
  variant?: "pie" | "donut";
  appearance?: "circular" | "semiCircular";
  format?: "percentage" | "number";
  legend?: boolean;
  /**
   * `"stacked"` (default): the chart with a stacked legend listing each item's
   * share — side by side from 400px wide, below the chart when narrower.
   * `"default"`: the compact legend under the chart. Matches react-ui's
   * Recharts PieChart.
   */
  legendVariant?: "default" | "stacked";
  /** When set, this chart publishes its legend to the shared legend store under
   *  this key instead of rendering an inline legend. Place a
   *  `<StackedLegend legendKey="…" />` (under a `LegendStoreProvider`) anywhere to
   *  render + drive it. Keys must be unique per chart instance. */
  legendKey?: string;
  /**
   * Play the entrance animation. Gates the entrance ONLY — any hover or
   * data-update motion is independent of this flag, and printing always
   * disables it.
   * Default false (streaming-safe: marks mounted while data streams in don't
   * replay staggered entrances).
   */
  isAnimationActive?: boolean;
  cornerRadius?: number;
  paddingAngle?: number;
  maxChartSize?: number;
  minChartSize?: number;
  height?: number | string;
  width?: number | string;
  fitLegendInHeight?: boolean;
  className?: string;
  onClick?: (row: T[number], index: number) => void;
}
