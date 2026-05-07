"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

const ScatterPolarGLSchema = z.object({
  r: z.array(z.number()),
  theta: z.union([z.array(z.number()), z.array(z.string())]),
  mode: z.enum(["markers", "lines", "lines+markers"]).optional(),
  color: z.string().optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const ScatterPolarGL = defineComponent({
  name: "ScatterPolarGL",
  props: ScatterPolarGLSchema,
  description:
    "WebGL-accelerated polar scatter. Same API as ScatterPolar but for very-high-point-count polar data. Use when ScatterPolar feels sluggish past ~10k points.",
  component: ({ props }) => {
    const trace = {
      type: "scatterpolargl",
      r: props.r,
      theta: props.theta,
      mode: props.mode ?? "markers",
      marker: props.color ? { color: props.color } : undefined,
      line: props.color ? { color: props.color } : undefined,
    } as unknown as Data;
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      polar: { angularaxis: { direction: "clockwise" } },
      showlegend: false,
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
  },
});
