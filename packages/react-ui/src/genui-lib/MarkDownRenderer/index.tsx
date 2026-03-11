"use client";

import { defineComponent } from "@openuidev/react-lang";
import { MarkDownRenderer as OpenUIMarkDownRenderer } from "../../components/MarkDownRenderer";
import { MarkDownRendererSchema } from "./schema";

export { MarkDownRendererSchema } from "./schema";

export const MarkDownRenderer = defineComponent({
  name: "MarkDownRenderer",
  props: MarkDownRendererSchema,
  description: "Renders markdown text with optional container variant",
  component: ({ props }) => (
    <OpenUIMarkDownRenderer
      textMarkdown={props.textMarkdown as string}
      variant={props.variant as "clear" | "card" | "sunk" | undefined}
    />
  ),
});
