import type { BaseChartProps, ChartData, HoverOverlayProps } from "../types";

export type LineChartData = ChartData;

export type LineChartVariant = "linear" | "natural" | "step";

export interface LineChartProps<T extends LineChartData>
  extends BaseChartProps<T>, HoverOverlayProps {
  variant?: LineChartVariant;
  showDots?: boolean;
  dotRadius?: number;
  onClick?: (row: T[number], index: number) => void;
}
