"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { TextCallout } from "../../../../components/TextCallout";
import { InlineMarkdownRenderer } from "../InlineMarkdownRenderer/InlineMarkdownRenderer";
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
