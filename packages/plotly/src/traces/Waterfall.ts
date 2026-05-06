"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { buildAxisLayout } from "../helpers/buildTrace";
import { PlotShell } from "../shell/PlotShell";

const WaterfallSchema = z.object({
  x: z.array(z.union([z.string(), z.number()])),
  y: z.array(z.number()),
  measure: z.array(z.enum(["relative", "total", "absolute"])).optional(),
  orientation: z.enum(["v", "h"]).optional(),
  title: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Waterfall = defineComponent({
  name: "Waterfall",
  props: WaterfallSchema,
  description:
    "Waterfall chart — running totals with up/down deltas. `x` is category labels, `y` is the delta value at each step. `measure` per step: 'relative' (default — adds to running total), 'total' (subtotal), 'absolute' (resets running total).",
  component: ({ props }) => {
    const orientation = props.orientation ?? "v";
    const measure = props.measure ?? props.y.map(() => "relative" as const);
    const trace = {
      type: "waterfall",
      orientation,
      x: orientation === "v" ? (props.x as Array<string | number>) : props.y,
      y: orientation === "v" ? props.y : (props.x as Array<string | number>),
      measure,
      connector: { line: { color: "rgba(15,23,42,0.18)" } },
      increasing: { marker: { color: "#16a34a" } },
      decreasing: { marker: { color: "#dc2626" } },
      totals: { marker: { color: "#4c78a8" } },
    } as unknown as Data;
    const layout: Partial<Layout> = {
      ...(buildAxisLayout(props) as Partial<Layout>),
      showlegend: false,
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
  },
});
