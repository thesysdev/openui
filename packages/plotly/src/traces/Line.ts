"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { buildAxisLayout, resolve, splitByGroup } from "../helpers/buildTrace";
import { PlotShell } from "../shell/PlotShell";

const LineSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  x: z.union([z.array(z.union([z.string(), z.number()])), z.string()]),
  y: z.union([z.array(z.number()), z.string()]),
  color: z.union([z.array(z.string()), z.string()]).optional(),
  smooth: z.boolean().optional(),
  showMarkers: z.boolean().optional(),
  title: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Line = defineComponent({
  name: "Line",
  props: LineSchema,
  description:
    "Line chart. Same `data`/`x`/`y` patterns as Bar — Express style with field names, or Graph-Objects with parallel arrays. `color` adds multiple series. `smooth=true` uses spline interpolation; `showMarkers=true` overlays point markers.",
  component: ({ props }) => {
    const r = resolve({
      data: props.data ?? undefined,
      x: props.x,
      y: props.y,
      color: props.color,
    });
    if (!r) return null;
    const groups = splitByGroup(r);
    const traces: Data[] = groups.map((g) => ({
      type: "scatter",
      mode: props.showMarkers ? "lines+markers" : "lines",
      x: g.x as Array<string | number>,
      y: g.y as number[],
      name: g.group || undefined,
      line: props.smooth ? { shape: "spline", smoothing: 1.0 } : undefined,
    }));
    const layout: Partial<Layout> = {
      ...(buildAxisLayout(props) as Partial<Layout>),
      showlegend: groups.length > 1 && groups[0]!.group !== "",
    };
    return React.createElement(PlotShell, { data: traces, layout, height: props.height });
  },
});
