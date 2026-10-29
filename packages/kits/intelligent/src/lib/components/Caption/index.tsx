"use client";

import { defineComponent } from "@openuidev/react-lang";
import { inline } from "../markdownBlocks";
import { fg, str } from "../style";
import { CaptionSchema } from "./schema";

export * from "./schema";

export const Caption = defineComponent({
  name: "Caption",
  props: CaptionSchema,
  description: "Small secondary text.",
  component: ({ props }) => (
    <p className="iui-caption" style={{ color: fg(props.color) }}>
      {inline(str(props.text))}
    </p>
  ),
});
