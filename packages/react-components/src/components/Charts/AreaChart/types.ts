import type { BaseChartProps, ChartData, HoverOverlayProps } from "../types";

export type AreaChartData = ChartData;

export type AreaChartVariant = "linear" | "natural" | "step";

export interface AreaChartProps<T extends AreaChartData>
  extends BaseChartProps<T>, HoverOverlayProps {
  variant?: AreaChartVariant;
  stacked?: boolean;
  onClick?: (row: T[number], index: number) => void;
}
