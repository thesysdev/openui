"use client";

import { defineComponent } from "@openuidev/react-lang";
import { inline } from "../../components/Markdown/markdownBlocks";
import { Caption as CaptionView } from "../../components/Caption";
import { str } from "../../shared/style";
import { CaptionSchema } from "./schema";

export * from "./schema";

export const Caption = defineComponent({
  name: "Caption",
  props: CaptionSchema,
  description: "Small secondary text.",
  component: ({ props }) => <CaptionView color={props.color}>{inline(str(props.text))}</CaptionView>,
});
