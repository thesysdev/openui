"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";
import { resolveColormap } from "../shell/colormap";

const Scatter3DSchema = z.object({
  x: z.array(z.number()),
  y: z.array(z.number()),
  z: z.array(z.number()),
  mode: z.enum(["markers", "lines", "lines+markers"]).optional(),
  color: z.union([z.array(z.number()), z.string()]).optional(),
  size: z.union([z.array(z.number()), z.number()]).optional(),
  colormap: z.string().optional(),
  text: z.array(z.string()).optional(),
  title: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  zLabel: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Scatter3D = defineComponent({
  name: "Scatter3D",
  props: Scatter3DSchema,
  description:
    "WebGL 3D scatter / line plot. Pass `x`/`y`/`z` arrays. `color` may be a constant string or numeric array (uses `colormap`, default 'viridis'). `mode='lines'` for 3D paths.",
  component: ({ props }) => {
    const numericColor = Array.isArray(props.color) ? (props.color as number[]) : undefined;
    const trace: Data = {
      type: "scatter3d",
      x: props.x,
      y: props.y,
      z: props.z,
      mode: props.mode ?? "markers",
      text: props.text,
      marker: {
        size: (props.size as never) ?? 4,
        color: (numericColor ?? props.color) as never,
        colorscale: numericColor
          ? (resolveColormap(props.colormap ?? "viridis") as never)
          : undefined,
        showscale: !!numericColor,
      },
      line: { width: 2, color: numericColor ? undefined : (props.color as string) },
    };
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      scene: {
        xaxis: { title: { text: props.xLabel ?? "x" } },
        yaxis: { title: { text: props.yLabel ?? "y" } },
        zaxis: { title: { text: props.zLabel ?? "z" } },
      },
      margin: { t: props.title ? 32 : 8, l: 0, r: 0, b: 0 },
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height ?? 420 });
  },
});
