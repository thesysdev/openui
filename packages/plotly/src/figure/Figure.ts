"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Config, Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

const FigureSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  layout: z.record(z.string(), z.unknown()).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  height: z.number().positive().optional(),
});

export const Figure = defineComponent({
  name: "Figure",
  props: FigureSchema,
  description:
    "Generic Plotly Graph-Objects figure. Pass `data` as an array of full Plotly trace objects, e.g. [{ type: 'bar', x: [...], y: [...] }, { type: 'scatter', x: [...], y: [...], mode: 'lines' }]. `layout` accepts the full Plotly layout JSON. Use this when you need a chart not covered by the typed Tier-1 components (Bar, Line, Heatmap, etc.).",
  component: ({ props }) =>
    React.createElement(PlotShell, {
      data: props.data as Data[],
      layout: props.layout as Partial<Layout> | undefined,
      config: props.config as Partial<Config> | undefined,
      height: props.height,
    }),
});
