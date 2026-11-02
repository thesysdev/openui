import { MetricIndicatorWithStrikethrough } from "@openuidev/react-components";
import clsx from "clsx";
import { names, styles } from "./metricIndicator.styles";

export interface MetricIndicatorProps {
  value: string;
  subtext?: string;
  trend?: { direction: "up" | "down"; value: number };
}

/** react-components' stacked metric, at the dashboard's larger scale. */
export function MetricIndicator({ value, subtext, trend }: MetricIndicatorProps) {
  return (
    <MetricIndicatorWithStrikethrough
      className={clsx(styles.root, names.root)}
      value={value}
      subtext={subtext}
      trend={trend && Number.isFinite(trend.value) ? trend : undefined}
    />
  );
}
