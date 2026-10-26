"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { ConversionFunnel as ConversionFunnelView } from ".";
import { funnelStepSchema } from "../../core/schemas";
import { Pending } from "../Pending/Pending.definition";

export const ConversionFunnel = defineComponent({
  name: "ConversionFunnel",
  description:
    "Ordered conversion funnel: one bar per step with its count, the share that continues and drops off between steps, the median time between steps, the change in step conversion against the previous period, and the overall conversion. Pass a funnel tool's steps directly: ConversionFunnel(funnel.steps).",
  props: z.object({
    steps: z.array(funnelStepSchema).default([]),
    format: z.enum(["number", "currency"]).optional(),
  }),
  component: ({ props }) => {
    const steps = props.steps ?? [];
    if (steps.length === 0) return <Pending kind="funnel" />;
    return <ConversionFunnelView steps={steps} format={props.format} />;
  },
});
