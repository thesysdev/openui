"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { Callout } from "../../../../components/Callout";
import { InlineMarkdownRenderer } from "../InlineMarkdownRenderer/InlineMarkdownRenderer";
import { calloutPropsSchema, type CalloutProps } from "./schema";

function CalloutRenderer({ props }: ComponentRenderProps<CalloutProps>) {
  return (
    <Callout
      variant={props.variant}
      title={props.title ? <InlineMarkdownRenderer content={props.title} /> : undefined}
      description={
        props.description ? <InlineMarkdownRenderer content={props.description} /> : undefined
      }
    />
  );
}

export const CalloutComponent = defineComponent({
  name: "Callout",
  props: calloutPropsSchema,
  description: "",
  component: CalloutRenderer,
});
