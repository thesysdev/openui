"use client";

import { defineComponent } from "@openuidev/react-lang";
import { inline } from "../markdownBlocks";
import { str } from "../style";
import { QuoteSchema } from "./schema";

export * from "./schema";

export const Quote = defineComponent({
  name: "Quote",
  props: QuoteSchema,
  description: "A quotation or a callout with a side rule; cite names the source.",
  component: ({ props }) => (
    <blockquote className="iui-quote">
      <p>{inline(str(props.text))}</p>
      {props.cite ? <cite>{inline(str(props.cite))}</cite> : null}
    </blockquote>
  ),
});
