"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

const ScatterGeoSchema = z.object({
  lat: z.array(z.number()),
  lon: z.array(z.number()),
  text: z.array(z.string()).optional(),
  size: z.union([z.array(z.number()), z.number()]).optional(),
  color: z.union([z.array(z.string()), z.string()]).optional(),
  scope: z
    .enum(["world", "usa", "europe", "asia", "africa", "north america", "south america"])
    .optional(),
  mode: z.enum(["markers", "lines", "lines+markers"]).optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const ScatterGeo = defineComponent({
  name: "ScatterGeo",
  props: ScatterGeoSchema,
  description:
    "Geographic scatter / lines on a globe (cartesian projection). Pass `lat` and `lon` arrays. `text` for hover labels per point. `mode='lines'` draws great-circle paths between consecutive lat/lon pairs.",
  component: ({ props }) => {
    const trace: Data = {
      type: "scattergeo",
      lat: props.lat,
      lon: props.lon,
      text: props.text,
      mode: props.mode ?? "markers",
      marker: {
        size: (props.size as never) ?? 6,
        color: props.color as never,
      },
    };
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      geo: {
        scope: props.scope ?? "world",
        showland: true,
        landcolor: "rgba(15,23,42,0.04)",
        projection: { type: "natural earth" },
      } as never,
      margin: { t: props.title ? 32 : 8, l: 0, r: 0, b: 0 },
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height ?? 380 });
  },
});
