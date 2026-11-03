"use client";

import { Callout, InlineMarkdownRenderer } from "@openuidev/react-components";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
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
