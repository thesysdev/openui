"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";
import { resolveColormap } from "../shell/colormap";

const ParCoordsSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  dimensions: z.array(z.string()),
  color: z.string().optional(),
  colormap: z.string().optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const ParCoords = defineComponent({
  name: "ParCoords",
  props: ParCoordsSchema,
  description:
    "Parallel coordinates plot — one polyline per row across multiple axes. Pass `data` as row objects and `dimensions` as the field names to plot. `color` is an optional numeric field name for continuous coloring (uses `colormap`, default 'viridis'). Brushing on each axis filters interactively.",
  component: ({ props }) => {
    const rows = props.data ?? [];
    const dims = props.dimensions ?? [];
    if (rows.length === 0 || dims.length === 0) return null;
    const dimensionsArr = dims.map((d) => ({
      label: d,
      values: rows.map((r) => Number(r[d])),
    }));
    const trace = {
      type: "parcoords",
      dimensions: dimensionsArr,
      line: props.color
        ? {
            color: rows.map((r) => Number(r[props.color as string])),
            colorscale: resolveColormap(props.colormap ?? "viridis"),
            showscale: true,
          }
        : { color: "#4c78a8" },
    } as unknown as Data;
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      margin: { t: props.title ? 60 : 32, l: 60, r: 60, b: 24 },
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height ?? 360 });
  },
});
