"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

const CarpetSchema = z.object({
  a: z.array(z.number()),
  b: z.array(z.number()),
  x: z.array(z.array(z.number())).optional(),
  y: z.array(z.array(z.number())).optional(),
  carpet: z.string().optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Carpet = defineComponent({
  name: "Carpet",
  props: CarpetSchema,
  description:
    "Carpet grid (a,b) — the underlying coordinate system for ScatterCarpet and ContourCarpet. Pass `a`/`b` axis values; `x`/`y` are 2D arrays specifying the grid's mapping to cartesian space. `carpet` is the id used by overlaid traces.",
  component: ({ props }) => {
    const trace = {
      type: "carpet",
      carpet: props.carpet ?? "carpet1",
      a: props.a,
      b: props.b,
      x: props.x,
      y: props.y,
    } as unknown as Data;
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
  },
});
