"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import {
  MetricIndicatorInline as OpenUIMetricIndicatorInline,
  MetricIndicatorWithStrikethrough as OpenUIMetricIndicatorWithStrikethrough,
} from "../../components/MetricIndicator";
import {
  MetricIndicatorInlineSchema,
  MetricIndicatorWithStrikethroughSchema,
  type MetricIndicatorInlineProps,
  type MetricIndicatorWithStrikethroughProps,
} from "./schema";

export * from "./schema";

function MetricIndicatorWithStrikethroughRenderer({
  props,
}: ComponentRenderProps<MetricIndicatorWithStrikethroughProps>) {
  return (
    <OpenUIMetricIndicatorWithStrikethrough
      value={props.value}
      subtext={props.subtext}
      previousValue={props.previousValue}
      trend={props.trend}
    />
  );
}

function MetricIndicatorInlineRenderer({
  props,
}: ComponentRenderProps<MetricIndicatorInlineProps>) {
  return (
    <OpenUIMetricIndicatorInline value={props.value} subtext={props.subtext} trend={props.trend} />
  );
}

export const MetricIndicatorWithStrikethrough = defineComponent({
  name: "MetricIndicatorWithStrikethrough",
  props: MetricIndicatorWithStrikethroughSchema,
  description:
    "Headline metric value with an optional struck-through previousValue, a +/- percentage trend, and subtext below.",
  component: MetricIndicatorWithStrikethroughRenderer,
});

export const MetricIndicatorInline = defineComponent({
  name: "MetricIndicatorInline",
  props: MetricIndicatorInlineSchema,
  description:
    "Headline metric value with an optional +/- percentage trend and subtext, all on one line.",
  component: MetricIndicatorInlineRenderer,
});
