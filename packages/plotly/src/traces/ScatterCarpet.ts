"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

const ScatterCarpetSchema = z.object({
  carpet: z.string(),
  a: z.array(z.number()),
  b: z.array(z.number()),
  mode: z.enum(["markers", "lines", "lines+markers"]).optional(),
  text: z.array(z.string()).optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const ScatterCarpet = defineComponent({
  name: "ScatterCarpet",
  props: ScatterCarpetSchema,
  description:
    "Scatter trace overlaid on a Carpet plot. References the Carpet's `carpet` id and provides `a`/`b` coordinates in carpet space. Compose alongside a Carpet trace in a Figure.",
  component: ({ props }) => {
    const trace = {
      type: "scattercarpet",
      carpet: props.carpet,
      a: props.a,
      b: props.b,
      mode: props.mode ?? "markers",
      text: props.text,
    } as unknown as Data;
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
  },
});
