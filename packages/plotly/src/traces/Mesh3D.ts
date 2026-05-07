"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";
import { resolveColormap } from "../shell/colormap";

const Mesh3DSchema = z.object({
  x: z.array(z.number()),
  y: z.array(z.number()),
  z: z.array(z.number()),
  i: z.array(z.number()).optional(),
  j: z.array(z.number()).optional(),
  k: z.array(z.number()).optional(),
  intensity: z.array(z.number()).optional(),
  colormap: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Mesh3D = defineComponent({
  name: "Mesh3D",
  props: Mesh3DSchema,
  description:
    "WebGL 3D mesh from a point cloud. Pass `x`/`y`/`z` (vertex coordinates). For an explicit triangulation pass `i`/`j`/`k` (vertex index triples per triangle); without them, Plotly computes a Delaunay/alpha-shape triangulation. Optional `intensity` for vertex coloring.",
  component: ({ props }) => {
    const trace = {
      type: "mesh3d",
      x: props.x,
      y: props.y,
      z: props.z,
      i: props.i,
      j: props.j,
      k: props.k,
      intensity: props.intensity,
      colorscale: resolveColormap(props.colormap ?? "viridis"),
      opacity: props.opacity ?? 1,
    } as unknown as Data;
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      margin: { t: props.title ? 32 : 8, l: 0, r: 0, b: 0 },
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height ?? 420 });
  },
});
