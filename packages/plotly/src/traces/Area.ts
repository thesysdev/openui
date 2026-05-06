"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { buildAxisLayout, resolve, splitByGroup } from "../helpers/buildTrace";
import { PlotShell } from "../shell/PlotShell";

const AreaSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  x: z.union([z.array(z.union([z.string(), z.number()])), z.string()]),
  y: z.union([z.array(z.number()), z.string()]),
  color: z.union([z.array(z.string()), z.string()]).optional(),
  stack: z.boolean().optional(),
  groupnorm: z.enum(["", "fraction", "percent"]).optional(),
  smooth: z.boolean().optional(),
  title: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Area = defineComponent({
  name: "Area",
  props: AreaSchema,
  description:
    "Filled area chart. `stack=true` stacks multiple series into a stream. `groupnorm`: 'percent' to normalize stacks to 100%, 'fraction' for 0..1, '' for raw values. `smooth=true` uses spline interpolation.",
  component: ({ props }) => {
    const r = resolve({
      data: props.data ?? undefined,
      x: props.x,
      y: props.y,
      color: props.color,
    });
    if (!r) return null;
    const groups = splitByGroup(r);
    const traces: Data[] = groups.map((g, i) => ({
      type: "scatter",
      mode: "lines",
      x: g.x as Array<string | number>,
      y: g.y as number[],
      name: g.group || undefined,
      fill: props.stack ? "tonexty" : i === 0 ? "tozeroy" : "tonexty",
      stackgroup: props.stack ? "one" : undefined,
      groupnorm: props.stack ? props.groupnorm : undefined,
      line: props.smooth ? { shape: "spline", smoothing: 1 } : undefined,
    }));
    const layout: Partial<Layout> = {
      ...(buildAxisLayout(props) as Partial<Layout>),
      showlegend: groups.length > 1 && groups[0]!.group !== "",
    };
    return React.createElement(PlotShell, { data: traces, layout, height: props.height });
  },
});
