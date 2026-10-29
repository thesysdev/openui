"use client";

import { defineComponent } from "@openuidev/react-lang";
import { MarkdownBlocks } from "../markdownBlocks";
import { str } from "../style";
import { MarkdownSchema } from "./schema";

export * from "./schema";

/**
 * The kit's own renderer, as in Open Intelligent UI. react-components'
 * MarkDownRenderer has no table support, so a | table | rendered as a line of
 * pipes, while this description promises tables to the model.
 */
export const Markdown = defineComponent({
  name: "Markdown",
  props: MarkdownSchema,
  description: "Prose with headings, lists, quotes, code and tables.",
  component: ({ props }) => (
    <div className="iui-markdown">
      <MarkdownBlocks text={str(props.text)} />
    </div>
  ),
});
