"use client";

import { defineComponent } from "@openuidev/react-lang";
import { inline } from "../../components/Markdown/markdownBlocks";
import { Quote as QuoteView } from "../../components/Quote";
import { str } from "../../shared/style";
import { QuoteSchema } from "./schema";

export * from "./schema";

export const Quote = defineComponent({
  name: "Quote",
  props: QuoteSchema,
  description: "A quotation or a callout with a side rule; cite names the source.",
  component: ({ props }) => (
    <QuoteView cite={props.cite ? inline(str(props.cite)) : undefined}>{inline(str(props.text))}</QuoteView>
  ),
});
