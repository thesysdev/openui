"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Tracker as TrackerView } from ".";
import { Pending } from "../../blocks/Pending/Pending.definition";
import { passed, type TrackerItem } from "../../core/schemas";

export const Tracker = defineComponent({
  name: "Tracker",
  description:
    "A strip of blocks, one per day or check, colored by whether it met its target, with the figure on hover and a count per status: on-time shipping, uptime, alert days. Pass a tracker tool's days and summary: Tracker(sla.days, sla.summary).",
  props: z.object({
    items: z.array(passed("A day from a tracker tool")).default([]),
    summary: z.string().optional().describe('One line above the strip, e.g. "96.8% on time"'),
  }),
  component: ({ props }) => {
    const items = (props.items ?? []) as unknown as TrackerItem[];
    if (items.length === 0) return <Pending kind="columns" />;
    return <TrackerView items={items} summary={props.summary} />;
  },
});
