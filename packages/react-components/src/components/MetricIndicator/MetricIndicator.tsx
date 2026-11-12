"use client";

import clsx from "clsx";
import { forwardRef } from "react";
import { metricIndicatorStyles, names } from "./metricIndicator.styles";

export interface MetricIndicatorTrend {
  direction: "up" | "down";
  value: number;
}

export interface MetricIndicatorWithStrikethroughProps {
  value: string;
  subtext?: string;
  previousValue?: string;
  trend?: MetricIndicatorTrend;
  className?: string;
}

export interface MetricIndicatorInlineProps {
  value: string;
  subtext?: string;
  trend?: MetricIndicatorTrend;
  className?: string;
}

interface MetricIndicatorBaseProps extends MetricIndicatorWithStrikethroughProps {
  variant: "with-strikethrough" | "inline";
}

const MetricIndicatorBase = forwardRef<HTMLDivElement, MetricIndicatorBaseProps>(
  ({ value, subtext, previousValue, trend, variant, className }, ref) => {
    const styles = metricIndicatorStyles;
    const isPositive = trend?.direction === "up";
    const isInline = variant === "inline";

    return (
      <div
        data-subtext={!!subtext || undefined}
        ref={ref}
        className={clsx(
          styles.root,
          names.root,
          styles.variant[variant],
          names.variant[variant],
          className,
        )}
      >
        <div className={clsx(styles.row, names.row)}>
          <div className={clsx(styles.mainValue, names.mainValue)}>{value}</div>
          {!isInline && previousValue && (
            <div className={clsx(styles.previousValue, names.previousValue)}>{previousValue}</div>
          )}
          {trend && (
            <div
              className={clsx(
                styles.trend,
                names.trend,
                styles.direction[trend.direction],
                names.direction[trend.direction],
              )}
            >
              {isPositive ? "+" : "-"}
              {trend.value}%
            </div>
          )}
          {isInline && subtext && (
            <div className={clsx(styles.subtext, names.subtext)}>{subtext}</div>
          )}
        </div>
        {!isInline && subtext && (
          <div className={clsx(styles.subtext, names.subtext)}>{subtext}</div>
        )}
      </div>
    );
  },
);

MetricIndicatorBase.displayName = "MetricIndicatorBase";

/** A headline metric with an optional struck-through previous value, trend and subtext. */
export const MetricIndicatorWithStrikethrough = forwardRef<
  HTMLDivElement,
  MetricIndicatorWithStrikethroughProps
>((props, ref) => <MetricIndicatorBase ref={ref} {...props} variant="with-strikethrough" />);

MetricIndicatorWithStrikethrough.displayName = "MetricIndicatorWithStrikethrough";

/** A headline metric with trend and subtext rendered on a single line. */
export const MetricIndicatorInline = forwardRef<HTMLDivElement, MetricIndicatorInlineProps>(
  (props, ref) => <MetricIndicatorBase ref={ref} {...props} variant="inline" />,
);

MetricIndicatorInline.displayName = "MetricIndicatorInline";
