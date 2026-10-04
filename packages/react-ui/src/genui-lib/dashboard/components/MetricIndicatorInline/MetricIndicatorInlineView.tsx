"use client";

import clsx from "clsx";
import { DASHBOARD_CLASS_PREFIX } from "../../classPrefix";
import type { MetricIndicatorInlineProps } from "./schema";

export function MetricIndicatorInlineView(props: MetricIndicatorInlineProps) {
  const isPositive = props.trend?.direction === "up";

  return (
    <div
      className={clsx(
        `${DASHBOARD_CLASS_PREFIX}-metric-indicator`,
        `${DASHBOARD_CLASS_PREFIX}-metric-indicator--variant-inline`,
        props.subtext && `${DASHBOARD_CLASS_PREFIX}-metric-indicator--has-subtext`,
      )}
    >
      <div className={`${DASHBOARD_CLASS_PREFIX}-metric-indicator__row`}>
        <div className={`${DASHBOARD_CLASS_PREFIX}-metric-indicator__main-value`}>
          {props.value}
        </div>
        {props.trend && Number.isFinite(props.trend.value) && (
          <div
            className={clsx(
              `${DASHBOARD_CLASS_PREFIX}-metric-indicator__trend`,
              isPositive
                ? `${DASHBOARD_CLASS_PREFIX}-metric-indicator__trend--success`
                : `${DASHBOARD_CLASS_PREFIX}-metric-indicator__trend--danger`,
            )}
          >
            {isPositive ? "+" : "-"}
            {props.trend.value}%
          </div>
        )}
        {props.subtext && (
          <div className={`${DASHBOARD_CLASS_PREFIX}-metric-indicator__subtext`}>
            {props.subtext}
          </div>
        )}
      </div>
    </div>
  );
}
