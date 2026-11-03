"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { OverviewCardBlock } from "../../components/OverviewCardBlock";
import { overviewCardBlockPropsSchema, type OverviewCardBlockProps } from "./schema";
export { OverviewCardItemComponent } from "./schema";

function OverviewCardBlockRenderer({ props }: ComponentRenderProps<OverviewCardBlockProps>) {
  return (
    <OverviewCardBlock
      items={(props.items ?? []).map((item) => item.props)}
      layout={props.layout}
      responsive={props.responsive}
      gap={props.gap}
    />
  );
}

export const OverviewCardBlockComponent = defineComponent({
  name: "OverviewCardBlock",
  props: overviewCardBlockPropsSchema,
  description: "",
  component: OverviewCardBlockRenderer,
});
