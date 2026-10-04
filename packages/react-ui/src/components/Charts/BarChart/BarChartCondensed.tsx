import { BarChart } from "./BarChart";
import type { BarChartData, BarChartProps } from "./types";

export type BarChartCondensedProps<T extends BarChartData> = Omit<
  BarChartProps<T>,
  "condensed" | "orientation"
>;

/** A vertical `BarChart` that fits its container's width instead of scrolling. */
export const BarChartCondensed = <T extends BarChartData>(props: BarChartCondensedProps<T>) => (
  <BarChart {...props} condensed />
);
