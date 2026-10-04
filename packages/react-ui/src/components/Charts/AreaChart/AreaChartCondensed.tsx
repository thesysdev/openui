import { AreaChart } from "./AreaChart";
import type { AreaChartData, AreaChartProps } from "./types";

export type AreaChartCondensedProps<T extends AreaChartData> = Omit<AreaChartProps<T>, "condensed">;

/** An `AreaChart` that fits its container's width instead of scrolling. */
export const AreaChartCondensed = <T extends AreaChartData>(props: AreaChartCondensedProps<T>) => (
  <AreaChart {...props} condensed />
);
