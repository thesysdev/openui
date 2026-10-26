"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { DriverCards as DriverCardsView } from "../components/DriverCards";
import type { Why } from "../core/schemas";
import { Pending } from "./Pending";

export const DriverCards = defineComponent({
  name: "DriverCards",
  description:
    "Why a metric moved, computed from the data: a summary sentence, a confidence label (Low means within the normal range, so no driver is singled out), any tracking change behind it, then each driver with its share of the change and what pushed the other way. Pass explain_change's result directly: DriverCards(why). Optional limit per list.",
  props: z.object({
    why: z.record(z.string(), z.unknown()).describe("explain_change's result, passed whole"),
    limit: z.number().optional(),
  }),
  component: ({ props }) => {
    const why = props.why as unknown as Why | undefined;
    if (!why || !why.summary || !Array.isArray(why.drivers))
      return <Pending kind="cards" rows={3} />;
    return <DriverCardsView why={why} limit={props.limit} />;
  },
});
