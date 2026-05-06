"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { buildAxisLayout } from "../helpers/buildTrace";
import { resolveColormap } from "../shell/colormap";
import { PlotShell } from "../shell/PlotShell";

const ContourSchema = z.object({
  z: z.array(z.array(z.number())),
  x: z.array(z.union([z.string(), z.number()])).optional(),
  y: z.array(z.union([z.string(), z.number()])).optional(),
  ncontours: z.number().int().positive().optional(),
  start: z.number().optional(),
  end: z.number().optional(),
  step: z.number().optional(),
  colormap: z.string().optional(),
  showLines: z.boolean().optional(),
  showLabels: z.boolean().optional(),
  filled: z.boolean().optional(),
  title: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Contour = defineComponent({
  name: "Contour",
  props: ContourSchema,
  description:
    "Contour plot of a 2D scalar field `z` (rows×cols). `start`/`end`/`step` define explicit contour levels; otherwise `ncontours` controls auto-leveling. `filled=false` to draw lines only; `showLabels=true` to label contour lines with their value.",
  component: ({ props }) => {
    const trace: Data = {
      type: "contour",
      z: props.z,
      x: props.x as Array<string | number> | undefined,
      y: props.y as Array<string | number> | undefined,
      ncontours: props.ncontours,
      contours: {
        start: props.start,
        end: props.end,
        size: props.step,
        showlines: props.showLines ?? true,
        showlabels: props.showLabels ?? false,
        coloring: props.filled === false ? "lines" : "fill",
      },
      colorscale: resolveColormap(props.colormap ?? "viridis") as never,
      colorbar: { thickness: 12, outlinewidth: 0 },
    };
    const layout: Partial<Layout> = buildAxisLayout(props) as Partial<Layout>;
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
  },
});
