"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { Metric as OpenUIMetric } from "../../components/Metric";
import { MetricSchema, type MetricProps } from "./schema";

export * from "./schema";

function MetricRenderer({ props }: ComponentRenderProps<MetricProps>) {
  return (
    <OpenUIMetric
      value={props.value}
      delta={props.delta ?? undefined}
      previous={props.previous ?? undefined}
      variant={props.variant}
      size={props.size}
    />
  );
}

export const Metric = defineComponent({
  name: "Metric",
  props: MetricSchema,
  description:
    'A value with an optional change, e.g. Metric("$48,200", "+8.1%"): a leading +/- on the change shows a green up or red down arrow. It has no label: in a Card give it the Card\'s title, and elsewhere compose one with Text or Heading. Metric uses the UI font, so its size follows its role: use size "sm" (14px) whenever it is not the hero number, which covers Table cells, EntityListItem right, ListItem and EntityTitle subtitles, ImageTitle content, the value of a horizontal ValueCard, and CompositeCardItem body (a CompositeCardItem footer price always renders at 18px), e.g. Col("Revenue", @Each(data.rows, "r", Metric(r.revenue, r.change, "horizontal", "sm"))) or EntityListItem("Trail Runner", Metric("$89", null, null, "sm")). Use "large" (18px) with variant "vertical" only for a standalone headline figure such as a KPI tile, Card([Metric("$48,200", "+8.1%", "vertical", "large")], null, "Revenue"); "default" (16px) is for a headline figure that sits inline. variant "horizontal" (default) puts the change beside the value, "vertical" under it. previous is an earlier value shown struck through after the current one; use it only for a real before/after, like a price drop or a revised figure, e.g. Metric("$89", "-26%", null, "sm", "$120"), and leave it out otherwise.',
  component: MetricRenderer,
});
