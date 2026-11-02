"use client";

import { MetricIndicatorInline as MetricIndicatorInlineView } from "@openuidev/react-components";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { metricIndicatorInlinePropsSchema, type MetricIndicatorInlineProps } from "./schema";
function MetricIndicatorInlineRenderer({
  props,
}: ComponentRenderProps<MetricIndicatorInlineProps>) {
  return <MetricIndicatorInlineView {...props} />;
}

export const MetricIndicatorInlineComponent = defineComponent({
  name: "MetricIndicatorInline",
  props: metricIndicatorInlinePropsSchema,
  description: "",
  component: MetricIndicatorInlineRenderer,
});

export { MetricIndicatorInline as MetricIndicatorInlineView } from "@openuidev/react-components";
export type { MetricIndicatorInlineProps } from "./schema";
