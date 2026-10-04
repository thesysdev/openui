"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import clsx from "clsx";
import { DASHBOARD_CLASS_PREFIX } from "../../classPrefix";
import { resolveTrend } from "../Trend/Trend";
import { metricIndicatorPropsSchema, type MetricIndicatorProps } from "./schema";

function MetricIndicatorRenderer({ props }: ComponentRenderProps<MetricIndicatorProps>) {
  // Trend(direction, value) child — resolveTrend also accepts the legacy raw
  // `{direction, value}` object shape.
  const trend = resolveTrend(props.trend);
  const isPositive = trend?.direction === "up";

  return (
    <div
      className={clsx(
        `${DASHBOARD_CLASS_PREFIX}-metric-indicator`,
        props.subtext && `${DASHBOARD_CLASS_PREFIX}-metric-indicator--has-subtext`,
      )}
    >
      <div className={`${DASHBOARD_CLASS_PREFIX}-metric-indicator__row`}>
        <div className={`${DASHBOARD_CLASS_PREFIX}-metric-indicator__main-value`}>
          {props.value}
        </div>
        {trend ? (
          <div
            className={clsx(
              `${DASHBOARD_CLASS_PREFIX}-metric-indicator__trend`,
              isPositive
                ? `${DASHBOARD_CLASS_PREFIX}-metric-indicator__trend--success`
                : `${DASHBOARD_CLASS_PREFIX}-metric-indicator__trend--danger`,
            )}
          >
            {isPositive ? "+" : "-"}
            {trend.value}%
          </div>
        ) : null}
      </div>
      {props.subtext ? (
        <div className={`${DASHBOARD_CLASS_PREFIX}-metric-indicator__subtext`}>{props.subtext}</div>
      ) : null}
    </div>
  );
}

export const MetricIndicatorComponent = defineComponent({
  name: "MetricIndicator",
  props: metricIndicatorPropsSchema,
  description: "",
  component: MetricIndicatorRenderer,
});
