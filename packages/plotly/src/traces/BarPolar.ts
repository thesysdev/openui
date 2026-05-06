"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

const BarPolarSchema = z.object({
  r: z.array(z.number()),
  theta: z.union([z.array(z.number()), z.array(z.string())]),
  width: z.union([z.number(), z.array(z.number())]).optional(),
  color: z.string().optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const BarPolar = defineComponent({
  name: "BarPolar",
  props: BarPolarSchema,
  description:
    "Polar bar chart (a.k.a. wind-rose, radial bar chart). Pass parallel `r` (bar lengths) and `theta` (bar angles, degrees). `width` controls bar widths.",
  component: ({ props }) => {
    const trace = {
      type: "barpolar",
      r: props.r,
      theta: props.theta,
      width: props.width as never,
      marker: props.color ? { color: props.color } : undefined,
    } as unknown as Data;
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      polar: { angularaxis: { direction: "clockwise" } },
      showlegend: false,
      margin: { t: props.title ? 40 : 16, l: 16, r: 16, b: 16 },
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
  },
});
