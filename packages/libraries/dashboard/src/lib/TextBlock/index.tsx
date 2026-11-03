"use client";

import { TextBlockView } from "@openuidev/react-components";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { textBlockPropsSchema, type TextBlockProps } from "./schema";

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
