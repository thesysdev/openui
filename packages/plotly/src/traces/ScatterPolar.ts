"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

const ScatterPolarSchema = z.object({
  r: z.array(z.number()),
  theta: z.union([z.array(z.number()), z.array(z.string())]),
  mode: z.enum(["markers", "lines", "lines+markers"]).optional(),
  fill: z.enum(["none", "toself", "tonext"]).optional(),
  thetaUnit: z.enum(["radians", "degrees"]).optional(),
  color: z.string().optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const ScatterPolar = defineComponent({
  name: "ScatterPolar",
  props: ScatterPolarSchema,
  description:
    "Polar scatter / line / radar plot. Pass parallel `r` (radii) and `theta` (angles in degrees by default; pass `thetaUnit='radians'` to switch). `mode`: 'markers' | 'lines' | 'lines+markers'. `fill='toself'` makes a closed radar-style polygon.",
  component: ({ props }) => {
    const trace: Data = {
      type: "scatterpolar",
      r: props.r,
      theta: props.theta as never,
      mode: props.mode ?? "markers",
      fill: props.fill,
      marker: props.color ? { color: props.color } : undefined,
      line: props.color ? { color: props.color } : undefined,
      thetaunit: (props.thetaUnit ?? "degrees") as never,
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
