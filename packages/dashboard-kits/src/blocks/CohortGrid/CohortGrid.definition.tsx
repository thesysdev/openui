"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { CohortGrid as CohortGridView } from ".";
import { passed, type CohortRow } from "../../core/schemas";
import { Pending } from "../Pending/Pending.definition";

export const CohortGrid = defineComponent({
  name: "CohortGrid",
  description:
    "Cohort table: one row per cohort (by start period) and one shaded cell per period since it started, with a size-weighted average row and a scale legend. Shows retention or repeat rates as percents, or cumulative value per customer (LTV) as currency. Pass a cohort tool's cohorts, periodLabels, and format directly.",
  props: z.object({
    cohorts: z.array(passed("A cohort row from a cohort tool")).default([]),
    periodLabels: z.array(z.string()).optional(),
    format: z.enum(["percent", "currency"]).optional(),
    sizeLabel: z.string().optional(),
  }),
  component: ({ props }) => {
    const cohorts = (props.cohorts ?? []) as unknown as CohortRow[];
    if (cohorts.length === 0) return <Pending kind="grid" rows={6} />;
    return (
      <CohortGridView
        cohorts={cohorts}
        periodLabels={props.periodLabels}
        format={props.format}
        sizeLabel={props.sizeLabel}
      />
    );
  },
});
