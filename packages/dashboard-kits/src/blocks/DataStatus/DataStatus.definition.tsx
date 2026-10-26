"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { DataStatus as DataStatusView, type DataStatusItem } from ".";
import { passed } from "../../core/schemas";

export const DataStatus = defineComponent({
  name: "DataStatus",
  description:
    "A row of chips on whether the numbers can be trusted: data complete through, restated days, filtered bots and internal users, identified share, and tracking breaks, each with its detail on hover. Pass a data status tool's items: DataStatus(status.items), in a LargeCard under the header.",
  props: z.object({
    items: z.array(passed("A status item")).default([]),
  }),
  component: ({ props }) => {
    const items = (props.items ?? []) as unknown as DataStatusItem[];
    if (items.length === 0) return null;
    return <DataStatusView items={items} />;
  },
});
