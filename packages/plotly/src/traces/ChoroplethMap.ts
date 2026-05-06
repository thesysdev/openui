"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";
import { resolveColormap } from "../shell/colormap";

const ChoroplethMapSchema = z.object({
  geojson: z.unknown(),
  locations: z.array(z.string()),
  z: z.array(z.number()),
  featureidkey: z.string().optional(),
  colormap: z.string().optional(),
  zmin: z.number().optional(),
  zmax: z.number().optional(),
  centerLat: z.number().optional(),
  centerLon: z.number().optional(),
  zoom: z.number().min(0).max(22).optional(),
  style: z.string().optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const ChoroplethMap = defineComponent({
  name: "ChoroplethMap",
  props: ChoroplethMapSchema,
  description:
    "Choropleth on an interactive MapLibre map using a custom GeoJSON FeatureCollection. Pass `geojson` (FeatureCollection), `locations` (feature ids), parallel `z` values, optional `featureidkey` (defaults to 'id', e.g. 'properties.name'). Combine with map zoom/center for region focus.",
  component: ({ props }) => {
    const trace = {
      type: "choroplethmap",
      geojson: props.geojson,
      locations: props.locations,
      z: props.z,
      featureidkey: props.featureidkey,
      colorscale: resolveColormap(props.colormap ?? "viridis"),
      zmin: props.zmin,
      zmax: props.zmax,
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
