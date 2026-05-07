"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

const ImageSchema = z.object({
  z: z.array(z.array(z.array(z.number()))),
  source: z.string().optional(),
  colormodel: z.enum(["rgb", "rgba", "hsl", "hsla"]).optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Image = defineComponent({
  name: "Image",
  props: ImageSchema,
  description:
    "Render a 2D image / pixel matrix as a Plotly trace. Pass `z` as a height×width×channels array (RGB or RGBA). Use `colormodel` to switch color spaces. Useful for rendering ML model attention maps, tensors, or small generated images inline.",
  component: ({ props }) => {
    const trace = {
      type: "image",
      z: props.z,
      source: props.source,
      colormodel: props.colormodel ?? "rgb",
    } as unknown as Data;
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      xaxis: { showticklabels: false, showgrid: false, zeroline: false },
      yaxis: { showticklabels: false, showgrid: false, zeroline: false, scaleanchor: "x" },
      margin: { t: props.title ? 32 : 8, l: 8, r: 8, b: 8 },
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
  },
});
