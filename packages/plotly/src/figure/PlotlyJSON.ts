"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Config, Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

const PlotlyJSONSchema = z.object({
  figure: z.object({
    data: z.array(z.record(z.string(), z.unknown())),
    layout: z.record(z.string(), z.unknown()).optional(),
    config: z.record(z.string(), z.unknown()).optional(),
  }),
  height: z.number().positive().optional(),
});

export const PlotlyJSON = defineComponent({
  name: "PlotlyJSON",
  props: PlotlyJSONSchema,
  description:
    "Render a fully-formed Plotly figure JSON object verbatim. Use this when a backend tool or query returns a figure produced server-side (e.g. Python `fig.to_json()`). Shape: { figure: { data: [...traces], layout?: {...}, config?: {...} } }.",
  component: ({ props }) => {
    const fig = props.figure;
    if (!fig || !Array.isArray(fig.data)) return null;
    return React.createElement(PlotShell, {
      data: fig.data as Data[],
      layout: fig.layout as Partial<Layout> | undefined,
      config: fig.config as Partial<Config> | undefined,
      height: props.height,
    });
  },
});
