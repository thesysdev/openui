"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import {
  CardSourceProvider,
  CardSourceSchema,
  Sources as OpenUISources,
} from "../../components/Sources";

export const Sources = defineComponent({
  name: "Sources",
  props: z.object({
    items: z.array(CardSourceSchema),
  }),
  description:
    'Row of source cards (favicon, site name, page title) that closes an answer built from real references, e.g. Sources([{ title: "Apple (AAPL) Statistics & Valuation", sourceName: "Stock Analysis", url: "https://stockanalysis.com/stocks/aapl/statistics/" }]). Each item links to its url.',
  component: ({ props }) => (
    <CardSourceProvider sources={props.items}>
      <OpenUISources />
    </CardSourceProvider>
  ),
});
