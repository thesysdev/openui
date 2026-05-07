"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

const IcicleSchema = z.object({
  ids: z.array(z.string()),
  parents: z.array(z.string()),
  values: z.array(z.number()).optional(),
  labels: z.array(z.string()).optional(),
  orientation: z.enum(["h", "v"]).optional(),
  branchvalues: z.enum(["remainder", "total"]).optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Icicle = defineComponent({
  name: "Icicle",
  props: IcicleSchema,
  description:
    "Icicle chart — rectangular hierarchical layout (think horizontal Sunburst). Same parallel `ids`/`parents`/`values` shape as Treemap. `orientation='h'` (default) stacks horizontally, 'v' vertically.",
  component: ({ props }) => {
    if (!props.ids?.length) return null;
    const trace = {
      type: "icicle",
      ids: props.ids,
      parents: props.parents,
      values: props.values,
      labels: props.labels ?? props.ids,
      branchvalues: props.branchvalues ?? "remainder",
      tiling: { orientation: props.orientation ?? "h" },
      hovertemplate: "<b>%{label}</b><br>value: %{value}<extra></extra>",
    } as unknown as Data;
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      margin: { t: props.title ? 40 : 8, l: 8, r: 8, b: 8 },
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
  },
});
