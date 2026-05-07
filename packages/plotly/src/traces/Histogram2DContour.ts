"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { buildAxisLayout } from "../helpers/buildTrace";
import { resolveColormap } from "../shell/colormap";
import { PlotShell } from "../shell/PlotShell";

const Histogram2DContourSchema = z.object({
  x: z.array(z.number()),
  y: z.array(z.number()),
  ncontours: z.number().int().positive().optional(),
  colormap: z.string().optional(),
  showPoints: z.boolean().optional(),
  title: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Histogram2DContour = defineComponent({
  name: "Histogram2DContour",
  props: Histogram2DContourSchema,
  description:
    "Smooth 2D KDE contour density of a point cloud. Use to show density structure where Histogram2D would feel chunky. `showPoints=true` overlays the raw samples on top.",
  component: ({ props }) => {
    const traces: Data[] = [
      {
        type: "histogram2dcontour",
        x: props.x,
        y: props.y,
        ncontours: props.ncontours ?? 20,
        colorscale: resolveColormap(props.colormap ?? "viridis") as never,
        colorbar: { thickness: 12, outlinewidth: 0 },
        showscale: true,
      },
    ];
    if (props.showPoints) {
      traces.push({
        type: "scatter",
        mode: "markers",
        x: props.x,
        y: props.y,
        marker: { size: 2, color: "rgba(15,23,42,0.4)" },
        showlegend: false,
        hoverinfo: "skip",
      });
    }
    const layout: Partial<Layout> = buildAxisLayout(props) as Partial<Layout>;
    return React.createElement(PlotShell, { data: traces, layout, height: props.height });
  },
});
