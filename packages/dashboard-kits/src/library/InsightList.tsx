"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { InsightList as InsightListView } from "../components/InsightList";
import { passed, type Insight } from "../core/schemas";
import { Pending } from "./Pending";

export const InsightList = defineComponent({
  name: "InsightList",
  description:
    "Automatically detected changes worth attention, each with a tone (positive, negative, warning, info), a headline, an explanation, and a key figure. Pass an insights tool's insights directly, with a limit: InsightList(insights.insights, 4).",
  props: z.object({
    insights: z.array(passed("An insight from an insights tool")).default([]),
    limit: z.number().optional(),
  }),
  component: ({ props }) => {
    const insights = (props.insights ?? []) as unknown as Insight[];
    if (insights.length === 0) {
      return <Pending kind="cards" rows={3} empty="Nothing unusual in this period." />;
    }
    return <InsightListView insights={insights} limit={props.limit} />;
  },
});
