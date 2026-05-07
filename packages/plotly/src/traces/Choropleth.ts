"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";
import { resolveColormap } from "../shell/colormap";

const ChoroplethSchema = z.object({
  locations: z.array(z.string()),
  z: z.array(z.number()),
  locationmode: z.enum(["ISO-3", "USA-states", "country names", "geojson-id"]).optional(),
  scope: z
    .enum(["world", "usa", "europe", "asia", "africa", "north america", "south america"])
    .optional(),
  colormap: z.string().optional(),
  zmin: z.number().optional(),
  zmax: z.number().optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Choropleth = defineComponent({
  name: "Choropleth",
  props: ChoroplethSchema,
  description:
    "Choropleth map (region color shading). Pass `locations` (e.g. ISO-3 country codes or US state codes) and parallel `z` values. `locationmode` defaults to 'ISO-3'; use 'USA-states' for two-letter US codes. `scope` zooms the map to a region.",
  component: ({ props }) => {
    const trace: Data = {
      type: "choropleth",
      locations: props.locations,
      z: props.z,
      locationmode: (props.locationmode ?? "ISO-3") as never,
      colorscale: resolveColormap(props.colormap ?? "viridis") as never,
      zmin: props.zmin,
      zmax: props.zmax,
      colorbar: { thickness: 12, outlinewidth: 0 },
    };
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      geo: {
        scope: props.scope ?? "world",
        showframe: false,
        projection: { type: "natural earth" },
      } as never,
      margin: { t: props.title ? 32 : 8, l: 0, r: 0, b: 0 },
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height ?? 380 });
  },
});
