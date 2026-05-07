"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";
import { resolveColormap } from "../shell/colormap";

const StreamTubeSchema = z.object({
  x: z.array(z.number()),
  y: z.array(z.number()),
  z: z.array(z.number()),
  u: z.array(z.number()),
  v: z.array(z.number()),
  w: z.array(z.number()),
  colormap: z.string().optional(),
  maxdisplayed: z.number().int().positive().optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const StreamTube = defineComponent({
  name: "StreamTube",
  props: StreamTubeSchema,
  description:
    "3D stream tubes — integrated paths through a vector field starting from given seed points. Same input shape as Cone (`x,y,z,u,v,w`). `maxdisplayed` caps the number of tubes for performance.",
  component: ({ props }) => {
    const trace = {
      type: "streamtube",
      x: props.x,
      y: props.y,
      z: props.z,
      u: props.u,
      v: props.v,
      w: props.w,
      colorscale: resolveColormap(props.colormap ?? "viridis"),
      maxdisplayed: props.maxdisplayed,
    } as unknown as Data;
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      margin: { t: props.title ? 32 : 8, l: 0, r: 0, b: 0 },
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height ?? 420 });
  },
});
