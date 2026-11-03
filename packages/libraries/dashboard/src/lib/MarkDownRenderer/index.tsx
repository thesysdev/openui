"use client";

import { MarkDownRenderer } from "@openuidev/react-components";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import clsx from "clsx";
import remarkGfm from "remark-gfm";
import { markdownName, markdownStyle } from "../../shared/markdown";
import { markDownRendererPropsSchema, type MarkDownRendererProps } from "./schema";
function MarkDownRendererRenderer({ props }: ComponentRenderProps<MarkDownRendererProps>) {
  return (
    <MarkDownRenderer
      textMarkdown={props.textMarkdown ?? ""}
      className={clsx(markdownStyle, markdownName)}
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
