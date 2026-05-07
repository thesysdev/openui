"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

const FunnelAreaSchema = z.object({
  stages: z.array(z.string()),
  values: z.array(z.number()),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const FunnelArea = defineComponent({
  name: "FunnelArea",
  props: FunnelAreaSchema,
  description:
    "Triangular funnel-area chart (a.k.a. ribbon funnel). Like Funnel but the area of each stage is proportional to value. Good for visual conversion stories where exact widths matter less than overall shape.",
  component: ({ props }) => {
    const trace: Data = {
      type: "funnelarea",
      values: props.values,
      labels: props.stages,
      textinfo: "label+percent",
    };
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      showlegend: false,
      margin: { t: props.title ? 40 : 8, l: 8, r: 8, b: 8 },
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
  },
});
