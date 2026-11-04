"use client";

import { MarkDownRenderer } from "@openuidev/react-components";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import remarkGfm from "remark-gfm";
import { markDownRendererPropsSchema, type MarkDownRendererProps } from "./schema";
function MarkDownRendererRenderer({ props }: ComponentRenderProps<MarkDownRendererProps>) {
  return (
    <MarkDownRenderer
      textMarkdown={props.textMarkdown ?? ""}
      options={{ remarkPlugins: [[remarkGfm, { singleTilde: false }]] }}
    />
  );
}

export const MarkDownRendererComponent = defineComponent({
  name: "MarkDownRenderer",
  props: markDownRendererPropsSchema,
  description: "",
  component: MarkDownRendererRenderer,
});
