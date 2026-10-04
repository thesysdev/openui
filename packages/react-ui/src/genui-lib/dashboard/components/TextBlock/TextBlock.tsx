"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { textBlockPropsSchema, type TextBlockProps } from "./schema";
import { TextBlockView } from "./TextBlockView";

function TextBlockRenderer({ props }: ComponentRenderProps<TextBlockProps>) {
  return <TextBlockView {...props} />;
}

export const TextBlockComponent = defineComponent({
  name: "TextBlock",
  props: textBlockPropsSchema,
  description: "",
  component: TextBlockRenderer,
});

export type { TextBlockProps } from "./schema";
export { TextBlockView } from "./TextBlockView";
