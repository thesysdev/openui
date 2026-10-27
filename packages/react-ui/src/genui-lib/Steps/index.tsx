"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Timeline as OpenUITimeline } from "../../components/Timeline";
import { withoutOwnNumber } from "../helpers";
import { renderOneOrMany } from "../oneOrMany";
import { StepsItemSchema } from "./schema";

export { StepsItemSchema } from "./schema";

export const StepsItem = defineComponent({
  name: "StepsItem",
  props: StepsItemSchema,
  description:
    'One numbered step: StepsItem(title, subtitle?). title is the action in a few words, with no "1." or other number of its own (the chip already numbers it): a string, or a Text, Link or Tag; there is no emphasis option, so to emphasize the title pass Text("Install the CLI", "body", true). subtitle is one or two plain sentences (not Markdown) on how to do it: a string, or a Text, Metric, Tag, TagBlock, LeadingText or Link. When title or subtitle needs two or more pieces side by side, pass an array.',
  component: () => null,
});

export const Steps = defineComponent({
  name: "Steps",
  props: z.object({
    items: z.array(StepsItem.ref),
  }),
  description:
    'A numbered how-to: Steps([StepsItem(Text("Install the CLI", "body", true), "Run npm i -g @openuidev/cli."), StepsItem(Text("Log in", "body", true), "Run openui login and follow the browser prompt.")]). Each step gets a 1, 2, 3 number chip automatically, so never number the titles yourself. Use it for instructions the reader carries out in order. For events in time order (an itinerary, schedule, history or tracking) use Timeline; for ranked picks or options use ListBlock.',
  component: ({ props, renderNode }) => {
    const items = (props.items ?? []) as { props?: { title?: unknown; subtitle?: unknown } }[];
    const cell = (value: unknown) => renderOneOrMany(value, renderNode);

    return (
      <OpenUITimeline
        marker="number"
        items={items.map((item) => ({
          title: cell(withoutOwnNumber(item?.props?.title)),
          subtitle: cell(item?.props?.subtitle),
        }))}
      />
    );
  },
});
