"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

const ScatterMapSchema = z.object({
  lat: z.array(z.number()),
  lon: z.array(z.number()),
  text: z.array(z.string()).optional(),
  size: z.union([z.array(z.number()), z.number()]).optional(),
  color: z.union([z.array(z.string()), z.string()]).optional(),
  mode: z.enum(["markers", "lines", "lines+markers"]).optional(),
  centerLat: z.number().optional(),
  centerLon: z.number().optional(),
  zoom: z.number().min(0).max(22).optional(),
  style: z.string().optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const ScatterMap = defineComponent({
  name: "ScatterMap",
  props: ScatterMapSchema,
  description:
    "Interactive map points using MapLibre tiles (no token required as of plotly.js 3.x). Pass `lat`/`lon` arrays. `centerLat`/`centerLon`/`zoom` set the initial viewport. `style`: 'open-street-map' (default), 'carto-positron', 'carto-darkmatter', 'white-bg', 'basic'.",
  component: ({ props }) => {
    const trace = {
      type: "scattermap",
      lat: props.lat,
      lon: props.lon,
      text: props.text,
      mode: props.mode ?? "markers",
      marker: {
        size: props.size ?? 8,
        color: props.color,
      },
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
