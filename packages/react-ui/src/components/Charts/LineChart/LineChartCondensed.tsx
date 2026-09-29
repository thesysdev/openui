import { LineChart } from "./LineChart";
import type { LineChartData, LineChartProps } from "./types";

export type LineChartCondensedProps<T extends LineChartData> = Omit<LineChartProps<T>, "condensed">;

/** A `LineChart` that fits its container's width instead of scrolling. */
export const LineChartCondensed = <T extends LineChartData>(props: LineChartCondensedProps<T>) => (
  <LineChart {...props} condensed />
);
