"use client";

import { MarkDownRenderer } from "@openuidev/react-components";
import { defineComponent } from "@openuidev/react-lang";
import { str } from "../style";
import { MarkdownSchema } from "./schema";

export * from "./schema";

export const Markdown = defineComponent({
  name: "Markdown",
  props: MarkdownSchema,
  description: "Prose with headings, lists, quotes, code and tables.",
  component: ({ props }) => <MarkDownRenderer textMarkdown={str(props.text)} />,
});
