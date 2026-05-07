"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

const ScatterMatrixSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  dimensions: z.array(z.string()),
  color: z.string().optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const ScatterMatrix = defineComponent({
  name: "ScatterMatrix",
  props: ScatterMatrixSchema,
  description:
    "Pairwise scatter matrix (a.k.a. SPLOM / pair plot). Pass `data` as an array of objects and `dimensions` as the field names to plot pairwise. Optional `color` field for categorical grouping (one color per unique value).",
  component: ({ props }) => {
    const rows = props.data ?? [];
    const dims = props.dimensions ?? [];
    if (rows.length === 0 || dims.length < 2) return null;

    const dimensionsArr = dims.map((d) => ({
      label: d,
      values: rows.map((r) => r[d] as number),
    }));

    let marker: Record<string, unknown> = { size: 4, line: { width: 0 } };
    if (props.color) {
      const groups = Array.from(new Set(rows.map((r) => String(r[props.color as string]))));
      const groupIdx = rows.map((r) => groups.indexOf(String(r[props.color as string])));
      marker = {
        size: 4,
        color: groupIdx,
        colorscale: groups.map((_, i) => [
          i / Math.max(1, groups.length - 1),
          `hsl(${(i * 360) / groups.length}, 60%, 50%)`,
        ]),
        showscale: false,
        line: { width: 0 },
      };
    }

    const trace = {
      type: "splom",
      dimensions: dimensionsArr,
      marker,
      diagonal: { visible: false },
      showupperhalf: false,
    } as unknown as Data;
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      dragmode: "select",
      hovermode: "closest",
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
  },
});
