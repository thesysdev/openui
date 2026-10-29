"use client";

import { defineComponent } from "@openuidev/react-lang";
import { inline } from "../markdownBlocks";
import { fg, str } from "../style";
import { TitleSchema } from "./schema";

export * from "./schema";

const HEADING_LEVEL: Record<string, number> = { "3xl": 1, "2xl": 2, xl: 2, lg: 2, md: 3, sm: 4 };

export const Title = defineComponent({
  name: "Title",
  props: TitleSchema,
  description: "Heading; md for a card title, lg for a section, 2xl for a big number.",
  component: ({ props }) => {
    const sizeName = props.size ?? "md";
    return (
      <div role="heading" aria-level={HEADING_LEVEL[sizeName] ?? 3} className={`iui-title iui-title-${sizeName}`} style={{ color: fg(props.color) }}>
        {inline(str(props.text))}
      </div>
    );
  },
});
