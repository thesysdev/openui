"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";
import { resolveColormap } from "../shell/colormap";

const IsosurfaceSchema = z.object({
  x: z.array(z.number()),
  y: z.array(z.number()),
  z: z.array(z.number()),
  value: z.array(z.number()),
  isomin: z.number().optional(),
  isomax: z.number().optional(),
  surfaceCount: z.number().int().positive().optional(),
  colormap: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Isosurface = defineComponent({
  name: "Isosurface",
  props: IsosurfaceSchema,
  description:
    "Isosurface — 3D level-sets of a scalar field. `x`/`y`/`z` are sample point coordinates (typically a structured grid flattened); `value` is the scalar at each. `surfaceCount` controls how many iso-levels are drawn between `isomin` and `isomax`.",
  component: ({ props }) => {
    const trace = {
      type: "isosurface",
      x: props.x,
      y: props.y,
      z: props.z,
      value: props.value,
      isomin: props.isomin,
      isomax: props.isomax,
      surface: { count: props.surfaceCount ?? 4 },
      colorscale: resolveColormap(props.colormap ?? "viridis"),
      opacity: props.opacity ?? 0.6,
    } as unknown as Data;
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      margin: { t: props.title ? 32 : 8, l: 0, r: 0, b: 0 },
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height ?? 420 });
  },
});
