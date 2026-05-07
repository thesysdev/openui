"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

// IMPORTANT: Pie and Donut must NOT share a single schema instance — defineComponent
// tags the schema with the component name via schemaIdTags, and the second call
// overwrites the first. Effect: zod's toJSONSchema() only emits the last tag in
// $defs and the parser catalog drops the first component as "unknown".
// Build two structurally identical but distinct schemas instead.
const pieFields = () =>
  ({
    values: z.array(z.number()),
    labels: z.array(z.string()),
    hole: z.number().min(0).max(0.95).optional(),
    pull: z.union([z.number(), z.array(z.number())]).optional(),
    sort: z.boolean().optional(),
    rotation: z.number().optional(),
    title: z.string().optional(),
    height: z.number().positive().optional(),
  }) as const;

const PieSchema = z.object(pieFields());
const DonutSchema = z.object(pieFields());

export const Pie = defineComponent({
  name: "Pie",
  props: PieSchema,
  description:
    "Pie chart. Pass parallel `values` and `labels` arrays. `hole` (0..1) makes a donut. `pull` (0..1) explodes one or all slices. `sort=true` orders slices by value. Use Donut as a shortcut for a 0.5 hole.",
  component: ({ props }) => {
    const trace: Data = {
      type: "pie",
      values: props.values,
      labels: props.labels,
      hole: props.hole,
      pull: props.pull as never,
      sort: props.sort ?? true,
      rotation: props.rotation,
      textinfo: "label+percent",
      hovertemplate: "<b>%{label}</b><br>%{value} (%{percent})<extra></extra>",
    };
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      showlegend: false,
      margin: { t: props.title ? 40 : 8, l: 8, r: 8, b: 8 },
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
  },
});

export const Donut = defineComponent({
  name: "Donut",
  props: DonutSchema,
  description: "Donut chart — Pie with `hole=0.5` by default. Same props as Pie.",
  component: ({ props }) => {
    const trace: Data = {
      type: "pie",
      values: props.values,
      labels: props.labels,
      hole: props.hole ?? 0.5,
      pull: props.pull as never,
      sort: props.sort ?? true,
      rotation: props.rotation,
      textinfo: "label+percent",
      hovertemplate: "<b>%{label}</b><br>%{value} (%{percent})<extra></extra>",
    };
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      showlegend: false,
      margin: { t: props.title ? 40 : 8, l: 8, r: 8, b: 8 },
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
  },
});
