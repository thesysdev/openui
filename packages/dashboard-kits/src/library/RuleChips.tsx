"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { RuleChips as RuleChipsView } from "../components/RuleChips";

export const RuleChips = defineComponent({
  name: "RuleChips",
  description:
    "A quiet row of chips saying how the dashboard's numbers are counted: the comparison, time zone, currency, what sales include, where revenue comes from. Pass a KPI tool's rules: RuleChips(kpis.rules), under the KpiStrip in the same LargeCard.",
  props: z.object({
    rules: z.array(z.string()).default([]),
  }),
  component: ({ props }) => {
    const rules = props.rules ?? [];
    if (rules.length === 0) return null;
    return <RuleChipsView rules={rules} />;
  },
});
