"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { buildAxisLayout } from "../helpers/buildTrace";
import { resolveColormap } from "../shell/colormap";
import { PlotShell } from "../shell/PlotShell";

const Histogram2DSchema = z.object({
  x: z.array(z.number()),
  y: z.array(z.number()),
  nbinsx: z.number().int().positive().optional(),
  nbinsy: z.number().int().positive().optional(),
  colormap: z.string().optional(),
  histnorm: z.enum(["", "percent", "probability", "density", "probability density"]).optional(),
  title: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Histogram2D = defineComponent({
  name: "Histogram2D",
  props: Histogram2DSchema,
  description:
    "Rectangular 2D-histogram heatmap (counts of points falling in each bin). Use for >500 points where a Scatter would overplot. `nbinsx`/`nbinsy` override auto-binning.",
  component: ({ props }) => {
    const trace = {
      type: "histogram2d",
      x: props.x,
      y: props.y,
      nbinsx: props.nbinsx,
      nbinsy: props.nbinsy,
      histnorm: props.histnorm,
      colorscale: resolveColormap(props.colormap ?? "viridis"),
      colorbar: { thickness: 12, outlinewidth: 0 },
    } as unknown as Data;
    const layout: Partial<Layout> = buildAxisLayout(props) as Partial<Layout>;
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
  },
});
