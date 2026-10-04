"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { MetricIndicatorInlineView } from "./MetricIndicatorInlineView";
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

export { MetricIndicatorInlineView } from "./MetricIndicatorInlineView";
export type { MetricIndicatorInlineProps } from "./schema";
