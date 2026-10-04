"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import remarkGfm from "remark-gfm";
import { MarkDownRenderer } from "../../../../components/MarkDownRenderer";
import { textContentPropsSchema, type TextContentProps } from "./schema";

function TextContentRenderer({ props }: ComponentRenderProps<TextContentProps>) {
  return (
    <MarkDownRenderer
      textMarkdown={props.text ?? ""}
      options={{
        // singleTilde: false → only ~~double tildes~~ render as strikethrough.
        remarkPlugins: [[remarkGfm, { singleTilde: false }]],
      }}
    />
  );
}

export const TextContentComponent = defineComponent({
  name: "TextContent",
  props: textContentPropsSchema,
  description: "",
  component: TextContentRenderer,
});
