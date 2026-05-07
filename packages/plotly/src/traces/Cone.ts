"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";
import { resolveColormap } from "../shell/colormap";

const ConeSchema = z.object({
  x: z.array(z.number()),
  y: z.array(z.number()),
  z: z.array(z.number()),
  u: z.array(z.number()),
  v: z.array(z.number()),
  w: z.array(z.number()),
  colormap: z.string().optional(),
  sizemode: z.enum(["scaled", "absolute"]).optional(),
  sizeref: z.number().positive().optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Cone = defineComponent({
  name: "Cone",
  props: ConeSchema,
  description:
    "3D vector field as cones (arrows). At each `(x, y, z)` location, draws a cone in the direction `(u, v, w)`. Common for fluid dynamics, electromagnetics, gradient fields.",
  component: ({ props }) => {
    const trace = {
      type: "cone",
      x: props.x,
      y: props.y,
      z: props.z,
      u: props.u,
      v: props.v,
      w: props.w,
      colorscale: resolveColormap(props.colormap ?? "viridis"),
      sizemode: props.sizemode ?? "scaled",
      sizeref: props.sizeref ?? 1,
    } as unknown as Data;
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      margin: { t: props.title ? 32 : 8, l: 0, r: 0, b: 0 },
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height ?? 420 });
  },
});
