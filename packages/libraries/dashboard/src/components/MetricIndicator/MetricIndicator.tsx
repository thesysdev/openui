import { MetricIndicatorWithStrikethrough } from "@openuidev/react-components";
import clsx from "clsx";
import { formatMetric } from "../../shared/format";
import { trendMagnitude } from "../../shared/trend";
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
      value={formatMetric(value)}
      subtext={subtext}
      trend={
        trend && Number.isFinite(trend.value)
          ? { ...trend, value: trendMagnitude(trend.value, trend.direction) }
          : undefined
      }
    />
  );
}
