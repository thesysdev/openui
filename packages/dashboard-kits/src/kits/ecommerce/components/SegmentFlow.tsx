"use client";

// SegmentFlow: how customers moved between RFM segments over 90 days.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { SegmentFlow as SegmentFlowView } from "../../../components/charts/SegmentFlow";
import { passed } from "../../../core/schemas";
import { Pending } from "../../../library/Pending";

/** Segments best first, with first orders coming in at the top and lapsed customers leaving at the bottom. */
const SEGMENT_ORDER = [
  "First order",
  "Champions",
  "Loyal",
  "Promising",
  "New",
  "Needs attention",
  "At risk",
  "Almost lost",
  "Dormant",
  "Lapsed",
];

export const SegmentFlow = defineComponent({
  name: "SegmentFlow",
  description:
    "How customers moved between RFM segments over 90 days, as ribbons from then to now colored by direction, with the biggest moves in words: SegmentFlow(segments.movement).",
  props: z.object({
    moves: z.array(passed("A move from get_customer_segments")).default([]),
  }),
  component: ({ props }) => {
    const moves = (props.moves ?? []) as unknown as {
      from: string;
      to: string;
      customers: number;
    }[];
    if (moves.length === 0) return <Pending kind="columns" />;
    return (
      <SegmentFlowView
        links={moves.map((m) => ({ from: m.from, to: m.to, value: m.customers }))}
        order={SEGMENT_ORDER}
        source="First order"
        sink="Lapsed"
      />
    );
  },
});
