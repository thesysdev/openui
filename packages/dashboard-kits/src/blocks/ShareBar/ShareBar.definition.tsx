"use client";

import { defineComponent, reactive, useStateField } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { ShareBar as ShareBarView } from ".";
import { formatSchema, itemSchema } from "../../core/schemas";
import { Pending } from "../Pending/Pending.definition";

export const ShareBar = defineComponent({
  name: "ShareBar",
  description:
    'Part-to-whole as one segmented bar with a legend of values and shares, for up to 6 parts (sales by channel, device mix, plan mix). Use it instead of PieChart: ShareBar(byChannel.items, "currency"). When the items carry filter keys, pass the matching filter $binding and selecting a part filters the dashboard: ShareBar(byChannel.items, "currency", $channel).',
  props: z.object({
    items: z.array(itemSchema).default([]),
    format: formatSchema.optional(),
    selected: reactive(z.string().optional()),
  }),
  component: ({ props }) => {
    const field = useStateField("breakdownSelection", props.selected);
    const items = props.items ?? [];
    if (items.length === 0) return <Pending kind="share" rows={4} />;
    return (
      <ShareBarView
        items={items}
        format={props.format}
        selected={typeof field.value === "string" ? field.value : undefined}
        onSelect={field.isReactive ? (key) => field.setValue(key) : undefined}
      />
    );
  },
});
