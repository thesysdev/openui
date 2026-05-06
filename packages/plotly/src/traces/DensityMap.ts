"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";
import { resolveColormap } from "../shell/colormap";

const DensityMapSchema = z.object({
  lat: z.array(z.number()),
  lon: z.array(z.number()),
  z: z.array(z.number()).optional(),
  radius: z.number().positive().optional(),
  colormap: z.string().optional(),
  centerLat: z.number().optional(),
  centerLon: z.number().optional(),
  zoom: z.number().min(0).max(22).optional(),
  style: z.string().optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const DensityMap = defineComponent({
  name: "DensityMap",
  props: DensityMapSchema,
  description:
    "Heatmap-style density overlay on an interactive map (MapLibre tiles). Pass `lat`/`lon` arrays. Optional `z` weights each point (e.g. magnitude); without it, density = count. `radius` controls smoothing kernel size in pixels.",
  component: ({ props }) => {
    const trace = {
      type: "densitymap",
      lat: props.lat,
      lon: props.lon,
      z: props.z,
      radius: props.radius ?? 12,
      colorscale: resolveColormap(props.colormap ?? "viridis"),
      colorbar: { thickness: 12, outlinewidth: 0 },
    } as unknown as Data;
    const layout = {
      title: props.title ? { text: props.title } : undefined,
      map: {
        style: props.style ?? "open-street-map",
        center: { lat: props.centerLat ?? 0, lon: props.centerLon ?? 0 },
        zoom: props.zoom ?? 1,
      },
      margin: { t: props.title ? 32 : 0, l: 0, r: 0, b: 0 },
    } as unknown as Partial<Layout>;
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height ?? 420 });
  },
});
