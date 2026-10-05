import { BarChart } from "./BarChart";
import type { BarChartData, BarChartProps, BarChartVariant } from "./types";

export type HorizontalBarChartData = BarChartData;
export type HorizontalBarChartVariant = BarChartVariant;
export type HorizontalBarChartProps<T extends HorizontalBarChartData> = Omit<
  BarChartProps<T>,
  "orientation"
>;

/** A `BarChart` with `orientation="horizontal"`: one labeled row per category. */
export const HorizontalBarChart = <T extends HorizontalBarChartData>(
  props: HorizontalBarChartProps<T>,
) => <BarChart {...props} orientation="horizontal" />;
