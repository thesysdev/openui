"use client";

import { InlineMarkdownRenderer, TextCallout } from "@openuidev/react-components";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { textCalloutPropsSchema, type TextCalloutProps } from "./schema";
function TextCalloutRenderer({ props }: ComponentRenderProps<TextCalloutProps>) {
  return (
    <TextCallout
      variant={props.variant}
      title={props.title ? <InlineMarkdownRenderer content={props.title} /> : undefined}
      description={
        props.description ? <InlineMarkdownRenderer content={props.description} /> : undefined
      }
    />
  );
}

export const TextCalloutComponent = defineComponent({
  name: "TextCallout",
  props: textCalloutPropsSchema,
  description: "",
  component: TextCalloutRenderer,
});
