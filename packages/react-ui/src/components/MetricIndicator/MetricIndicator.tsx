import clsx from "clsx";
import { forwardRef } from "react";

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
    const isPositive = trend?.direction === "up";
    const isInline = variant === "inline";

    return (
      <div
        ref={ref}
        className={clsx(
          "openui-metric-indicator",
          `openui-metric-indicator--variant-${variant}`,
          subtext && "openui-metric-indicator--has-subtext",
          className,
        )}
      >
        <div className="openui-metric-indicator__row">
          <div className="openui-metric-indicator__main-value">{value}</div>
          {!isInline && previousValue && (
            <div className="openui-metric-indicator__previous-value">{previousValue}</div>
          )}
          {trend && (
            <div
              className={clsx(
                "openui-metric-indicator__trend",
                isPositive
                  ? "openui-metric-indicator__trend--success"
                  : "openui-metric-indicator__trend--danger",
              )}
            >
              {isPositive ? "+" : "-"}
              {trend.value}%
            </div>
          )}
          {isInline && subtext && <div className="openui-metric-indicator__subtext">{subtext}</div>}
        </div>
        {!isInline && subtext && <div className="openui-metric-indicator__subtext">{subtext}</div>}
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
