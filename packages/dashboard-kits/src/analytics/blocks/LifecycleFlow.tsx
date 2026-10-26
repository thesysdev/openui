"use client";

// LifecycleFlow: ribbons of users moving between lifecycle states over 28 days.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Pending } from "../../blocks/Pending/Pending.definition";
import { SegmentFlow as SegmentFlowView } from "../../charts/SegmentFlow";
import { passed } from "../../core/schemas";

/** Lifecycle states best first, so a move toward an earlier one is an improvement. */
const FLOW_ORDER = ["Weekly active", "At risk", "Dormant", "Lapsed"];

export const LifecycleFlow = defineComponent({
  name: "LifecycleFlow",
  description:
    "Where users moved between lifecycle states over 28 days, as ribbons: LifecycleFlow(states.flow).",
  props: z.object({
    moves: z.array(passed("A move from get_lifecycle states")).default([]),
  }),
  component: ({ props }) => {
    const moves = (props.moves ?? []) as unknown as { from: string; to: string; users: number }[];
    if (moves.length === 0) return <Pending kind="columns" />;
    return (
      <SegmentFlowView
        links={moves.map((m) => ({ from: m.from, to: m.to, value: m.users }))}
        order={FLOW_ORDER}
        columns={["28 days ago", "Today"]}
        source="Signed up"
        sink="Lapsed"
        unit="users"
      />
    );
  },
});
