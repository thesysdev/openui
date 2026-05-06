"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

const TreemapSchema = z.object({
  ids: z.array(z.string()),
  parents: z.array(z.string()),
  values: z.array(z.number()).optional(),
  labels: z.array(z.string()).optional(),
  branchvalues: z.enum(["remainder", "total"]).optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Treemap = defineComponent({
  name: "Treemap",
  props: TreemapSchema,
  description:
    "Hierarchical treemap. Pass parallel arrays: `ids`, `parents` (root parent is empty string ''), `values`, optional `labels`. `branchvalues='total'` if values include parent sums; 'remainder' (default) sums from leaves.",
  component: ({ props }) => {
    if (!props.ids?.length || !props.parents?.length) return null;
    const trace: Data = {
      type: "treemap",
      ids: props.ids,
      parents: props.parents,
      values: props.values,
      labels: props.labels ?? props.ids,
      branchvalues: props.branchvalues ?? "remainder",
      hovertemplate:
        "<b>%{label}</b><br>value: %{value}<br>share: %{percentEntry:.1%} of parent<extra></extra>",
    };
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      margin: { t: props.title ? 40 : 8, l: 8, r: 8, b: 8 },
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
  },
});
