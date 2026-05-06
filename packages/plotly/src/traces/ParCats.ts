"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

const ParCatsSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  dimensions: z.array(z.string()),
  color: z.string().optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const ParCats = defineComponent({
  name: "ParCats",
  props: ParCatsSchema,
  description:
    "Parallel categories plot — multi-dimensional ribbon view of categorical fields. Pass `data` rows and `dimensions` (categorical field names). Optional `color` field gives ribbon coloring (numeric or categorical).",
  component: ({ props }) => {
    const rows = props.data ?? [];
    const dims = props.dimensions ?? [];
    if (rows.length === 0 || dims.length === 0) return null;
    const dimensionsArr = dims.map((d) => ({
      label: d,
      values: rows.map((r) => r[d]),
    }));
    const trace = {
      type: "parcats",
      dimensions: dimensionsArr,
      line: props.color
        ? {
            color: rows.map((r) => r[props.color as string]),
            colorscale: "Viridis",
          }
        : undefined,
    } as unknown as Data;
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      margin: { t: props.title ? 60 : 32, l: 60, r: 60, b: 24 },
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height ?? 360 });
  },
});
