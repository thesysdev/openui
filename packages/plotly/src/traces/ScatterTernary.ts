"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

const ScatterTernarySchema = z.object({
  a: z.array(z.number()),
  b: z.array(z.number()),
  c: z.array(z.number()),
  text: z.array(z.string()).optional(),
  mode: z.enum(["markers", "lines", "lines+markers"]).optional(),
  size: z.union([z.array(z.number()), z.number()]).optional(),
  color: z.union([z.array(z.string()), z.string()]).optional(),
  aLabel: z.string().optional(),
  bLabel: z.string().optional(),
  cLabel: z.string().optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const ScatterTernary = defineComponent({
  name: "ScatterTernary",
  props: ScatterTernarySchema,
  description:
    "Ternary scatter — points in a triangle whose three corners are constrained to sum to a constant. Pass parallel `a`/`b`/`c` arrays (compositions). Common in chemistry, soil science, mineralogy.",
  component: ({ props }) => {
    const trace = {
      type: "scatterternary",
      a: props.a,
      b: props.b,
      c: props.c,
      mode: props.mode ?? "markers",
      text: props.text,
      marker: { size: props.size ?? 8, color: props.color },
    } as unknown as Data;
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      ternary: {
        sum: 100,
        aaxis: { title: { text: props.aLabel ?? "a" } },
        baxis: { title: { text: props.bLabel ?? "b" } },
        caxis: { title: { text: props.cLabel ?? "c" } },
      } as never,
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height ?? 420 });
  },
});
