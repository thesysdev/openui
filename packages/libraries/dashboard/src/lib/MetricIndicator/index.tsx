"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { MetricIndicator } from "../../components/MetricIndicator";
import { metricIndicatorPropsSchema, type MetricIndicatorProps } from "./schema";

function MetricIndicatorRenderer({ props }: ComponentRenderProps<MetricIndicatorProps>) {
  return <MetricIndicator value={props.value} subtext={props.subtext} trend={props.trend} />;
}

export const MetricIndicatorComponent = defineComponent({
  name: "MetricIndicator",
  props: metricIndicatorPropsSchema,
  description: "",
  component: MetricIndicatorRenderer,
});
