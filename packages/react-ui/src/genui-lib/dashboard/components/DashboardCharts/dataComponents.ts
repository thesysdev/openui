"use client";

// Schema-only data components for charts. Never render (component: () => null).
// Registered in defineComponents.ts. Used via .ref in chart schemas for parse-time validation.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";

// Series — used by LineChart, BarChart, AreaChart, HorizontalBarChart, RadarChart
export const seriesPropsSchema = z.object({
  category: z.string(),
  values: z.array(z.number()),
});

export const SeriesComponent = defineComponent({
  name: "Series",
  props: seriesPropsSchema,
  description: "One data series",
  component: () => null,
});

// Point — single x/y coordinate, used as child of ScatterSeries
export const scatterPointPropsSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number().optional(),
});

export const PointComponent = defineComponent({
  name: "Point",
  props: scatterPointPropsSchema,
  description: "Data point",
  component: () => null,
});

// ScatterSeries — named dataset of Points, used by ScatterChart
export const scatterSeriesPropsSchema = z.object({
  name: z.string(),
  points: z.array(PointComponent.ref),
});

export const ScatterSeriesComponent = defineComponent({
  name: "ScatterSeries",
  props: scatterSeriesPropsSchema,
  description: "Named dataset",
  component: () => null,
});
