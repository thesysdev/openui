"use client";

import { defineComponent, reactive, useStateField } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { BarList as BarListView } from ".";
import { formatSchema, itemSchema } from "../../core/schemas";
import { Pending } from "../Pending/Pending.definition";

export const BarList = defineComponent({
  name: "BarList",
  description:
    'Ranked categories as horizontal bars with value, share, and change. Pass a breakdown tool\'s items: BarList(byCountry.items, "currency"). Under another chart, give it a caption: BarList(sources.activation, "percent", 6, "Activated in week 1"). With filter keys, the filter\'s $binding last makes rows filter the dashboard: BarList(byCategory.items, "currency", 8, "", $category).',
  props: z.object({
    items: z.array(itemSchema).default([]),
    format: formatSchema.optional(),
    limit: z.number().optional(),
    caption: z.string().optional(),
    selected: reactive(z.string().optional()),
  }),
  component: ({ props }) => {
    const field = useStateField("breakdownSelection", props.selected);
    const items = props.items ?? [];
    if (items.length === 0) return <Pending kind="list" />;
    return (
      <BarListView
        items={items}
        format={props.format}
        limit={props.limit}
        caption={props.caption || undefined}
        selected={typeof field.value === "string" ? field.value : undefined}
        onSelect={field.isReactive ? (key) => field.setValue(key) : undefined}
      />
    );
  },
});
