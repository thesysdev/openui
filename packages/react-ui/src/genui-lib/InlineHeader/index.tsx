"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { InlineHeader as OpenUIInlineHeader } from "../../components/InlineHeader";
import { InlineHeaderSchema, type InlineHeaderProps } from "./schema";

export * from "./schema";

function InlineHeaderRenderer({ props }: ComponentRenderProps<InlineHeaderProps>) {
  return <OpenUIInlineHeader heading={props.heading} description={props.description} />;
}

export const InlineHeader = defineComponent({
  name: "InlineHeader",
  props: InlineHeaderSchema,
  description:
    "Compact section heading with an optional one-line description, for use inside cards.",
  component: InlineHeaderRenderer,
});
