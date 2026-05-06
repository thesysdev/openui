"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { buildAxisLayout } from "../helpers/buildTrace";
import { isDivergingColormap, resolveColormap } from "../shell/colormap";
import { PlotShell } from "../shell/PlotShell";

const HeatmapSchema = z.object({
  z: z.array(z.array(z.number())),
  x: z.array(z.union([z.string(), z.number()])).optional(),
  y: z.array(z.union([z.string(), z.number()])).optional(),
  colormap: z.string().optional(),
  zmin: z.number().optional(),
  zmax: z.number().optional(),
  showText: z.boolean().optional(),
  textFormat: z.string().optional(),
  title: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Heatmap = defineComponent({
  name: "Heatmap",
  props: HeatmapSchema,
  description:
    "2D heatmap of a numeric matrix. `z` is rows×cols. `x`/`y` are optional axis labels. `colormap`: 'viridis' (default), 'inferno', 'plasma', 'magma', 'cividis', 'turbo', 'blues', 'RdBu', 'BrBG', 'PiYG', 'spectral'. Diverging colormaps auto-center on 0 unless `zmin`/`zmax` are provided. `showText=true` overlays cell values; `textFormat` is a Plotly d3-format string (default '.2f').",
  component: ({ props }) => {
    if (!props.z || props.z.length === 0) return null;
    const colorscale = resolveColormap(props.colormap ?? "viridis");
    const div = isDivergingColormap(props.colormap);

    let zmin = props.zmin;
    let zmax = props.zmax;
    if (div && zmin === undefined && zmax === undefined) {
      const flat = props.z.flat().filter(Number.isFinite) as number[];
      const absMax = Math.max(...flat.map(Math.abs));
      zmin = -absMax;
      zmax = absMax;
    }

    const trace: Data = {
      type: "heatmap",
      z: props.z,
      x: props.x as Array<string | number> | undefined,
      y: props.y as Array<string | number> | undefined,
      colorscale: colorscale as never,
      zmin,
      zmax,
      hoverongaps: false,
      texttemplate: props.showText ? `%{z:${props.textFormat ?? ".2f"}}` : undefined,
      textfont: props.showText ? { size: 10 } : undefined,
      colorbar: { thickness: 12, outlinewidth: 0, tickfont: { size: 10 } },
    };
    const layout: Partial<Layout> = buildAxisLayout(props) as Partial<Layout>;
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
  },
});
