"use client";

// ProfitWaterfall: the profit bridge from net sales to contribution profit.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { ProfitWaterfall as ProfitWaterfallView } from "../../../components/charts/ProfitWaterfall";
import { ledgerLineSchema } from "../../../core/schemas";
import { Pending } from "../../../library/Pending";

export const ProfitWaterfall = defineComponent({
  name: "ProfitWaterfall",
  description:
    "Profit bridge chart: a floating bar per step from net sales to contribution profit, the comparison as a dashed outline on each, the variance on hover: ProfitWaterfall(profit.lines, profit.comparisonLabel).",
  props: z.object({
    lines: z.array(ledgerLineSchema).default([]),
    comparisonLabel: z.string().optional().describe('What the dashed outlines are, e.g. "Plan"'),
  }),
  component: ({ props }) => {
    const lines = props.lines ?? [];
    if (lines.length === 0) return <Pending kind="columns" />;
    return (
      <ProfitWaterfallView
        steps={lines.map((l) => ({
          label: l.label,
          value: l.value,
          kind: l.kind,
          comparison: l.previous,
        }))}
        comparisonLabel={props.comparisonLabel}
        fill
      />
    );
  },
});
