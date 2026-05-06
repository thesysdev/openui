"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";
import { resolveColormap } from "../shell/colormap";

const SurfaceSchema = z.object({
  z: z.array(z.array(z.number())),
  x: z.array(z.number()).optional(),
  y: z.array(z.number()).optional(),
  colormap: z.string().optional(),
  showContours: z.boolean().optional(),
  title: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  zLabel: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Surface = defineComponent({
  name: "Surface",
  props: SurfaceSchema,
  description:
    "WebGL 3D surface plot. Pass `z` as a height×width matrix; optional `x`/`y` axis values. `showContours=true` projects contour lines onto the surface for shape readability.",
  component: ({ props }) => {
    const trace = {
      type: "surface",
      z: props.z,
      x: props.x,
      y: props.y,
      colorscale: resolveColormap(props.colormap ?? "viridis"),
      contours: props.showContours
        ? {
            z: { show: true, usecolormap: true, highlightcolor: "#ffffff", project: { z: true } },
          }
        : undefined,
      showscale: true,
    } as unknown as Data;
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
