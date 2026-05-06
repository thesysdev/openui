"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";
import { resolveColormap } from "../shell/colormap";

const ContourCarpetSchema = z.object({
  carpet: z.string(),
  a: z.array(z.number()),
  b: z.array(z.number()),
  z: z.array(z.number()),
  ncontours: z.number().int().positive().optional(),
  colormap: z.string().optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const ContourCarpet = defineComponent({
  name: "ContourCarpet",
  props: ContourCarpetSchema,
  description:
    "Contour overlay on a Carpet plot. References the Carpet's `carpet` id and provides `a`/`b`/`z` triples (a flat list of carpet-space samples).",
  component: ({ props }) => {
    const trace = {
      type: "contourcarpet",
      carpet: props.carpet,
      a: props.a,
      b: props.b,
      z: props.z,
      ncontours: props.ncontours ?? 14,
      colorscale: resolveColormap(props.colormap ?? "viridis"),
    } as unknown as Data;
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
  },
});
