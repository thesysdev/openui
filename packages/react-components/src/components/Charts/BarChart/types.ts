import type { BaseChartProps, ChartData } from "../types";

export type BarChartData = ChartData;

export type BarChartVariant = "grouped" | "stacked";

export type BarChartOrientation = "vertical" | "horizontal";

export interface BarChartProps<T extends BarChartData> extends BaseChartProps<T> {
  variant?: BarChartVariant;
  /**
   * Bar orientation. `'vertical'` (default) renders upward bars per category;
   * `'horizontal'` renders labeled scrolling rows with bars growing rightward
   * from the value-zero line. Default `'vertical'`.
   */
  orientation?: BarChartOrientation;
  barRadius?: number;
  /** Maximum width in px for a single bar. Bars will center within their band when capped. */
  maxBarWidth?: number;
  /** Show a decorative internal line inside each bar from base toward the tip. Default true. */
  internalLine?: boolean;
  /** Color of the internal line. Defaults to semi-transparent white. */
  internalLineColor?: string;
  /** Stroke width of the internal line. Defaults to 1. */
  internalLineWidth?: number;
  onClick?: (row: T[number], index: number) => void;
}
