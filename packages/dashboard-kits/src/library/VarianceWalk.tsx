"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { ProfitWaterfall } from "../components/charts/ProfitWaterfall";
import { formatSchema, walkStepSchema } from "../core/schemas";
import { Pending } from "./Pending";

export const VarianceWalk = defineComponent({
  name: "VarianceWalk",
  description:
    "A walk from the comparison to this period: the comparison's total, each change as a floating bar (blue lifted the metric, red lowered it), and this period's total, on an axis fitted to the change so small steps stay visible. Pass explain_change's walk, comparisonLabel, and format: VarianceWalk(why.walk, why.comparisonLabel, why.format). LargeCard reads best.",
  props: z.object({
    steps: z.array(walkStepSchema).default([]),
    comparisonLabel: z.string().optional(),
    format: formatSchema.optional(),
  }),
  component: ({ props }) => {
    const steps = props.steps ?? [];
    if (steps.length < 2) return <Pending kind="columns" />;
    return (
      <ProfitWaterfall
        steps={steps}
        comparisonLabel={props.comparisonLabel}
        format={props.format ?? "currency"}
        zero={false}
        fill
      />
    );
  },
});
