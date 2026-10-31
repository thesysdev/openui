"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Markdown as MarkdownView } from "../../components/Markdown";
import { str } from "../../shared/style";
import { MarkdownSchema } from "./schema";

export * from "./schema";

export const Markdown = defineComponent({
  name: "Markdown",
  props: MarkdownSchema,
  description: "Prose with headings, lists, quotes, code and tables.",
  component: ({ props }) => <MarkdownView text={str(props.text)} />,
});
