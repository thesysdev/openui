"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { HeatGrid as HeatGridView } from ".";
import { Pending } from "../../blocks/Pending/Pending.definition";
import { passed } from "../../core/schemas";

export const HeatGrid = defineComponent({
  name: "HeatGrid",
  description:
    'Weekday-by-hour cells shaded relative to the busiest, the hovered cell read out: HeatGrid(hours.rows, hours.columns, "orders").',
  props: z.object({
    rows: z.array(passed("A row from a heat grid tool")).default([]),
    columns: z.array(z.string()).default([]),
    unit: z.string().optional(),
  }),
  component: ({ props }) => {
    const rows = (props.rows ?? []) as unknown as { label: string; values: number[] }[];
    if (rows.length === 0) return <Pending kind="grid" rows={7} />;
    return <HeatGridView rows={rows} columns={props.columns ?? []} unit={props.unit} />;
  },
});
