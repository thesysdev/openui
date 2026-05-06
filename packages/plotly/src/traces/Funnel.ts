"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { buildAxisLayout } from "../helpers/buildTrace";
import { PlotShell } from "../shell/PlotShell";

const FunnelSchema = z.object({
  stages: z.array(z.string()),
  values: z.array(z.number()),
  orientation: z.enum(["h", "v"]).optional(),
  title: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Funnel = defineComponent({
  name: "Funnel",
  props: FunnelSchema,
  description:
    "Funnel chart — horizontal bars per stage with auto-computed conversion percentages between stages. Pass parallel `stages` (labels) and `values` arrays.",
  component: ({ props }) => {
    const orientation = props.orientation ?? "h";
    const trace = {
      type: "funnel",
      orientation,
      x: orientation === "h" ? props.values : (props.stages as Array<string | number>),
      y: orientation === "h" ? (props.stages as Array<string | number>) : props.values,
      textposition: "inside",
      textinfo: "value+percent initial",
    } as unknown as Data;
    const layout: Partial<Layout> = {
      ...(buildAxisLayout(props) as Partial<Layout>),
      showlegend: false,
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
  },
});
