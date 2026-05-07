"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { buildAxisLayout, resolve, splitByGroup } from "../helpers/buildTrace";
import { resolveColormap } from "../shell/colormap";
import { PlotShell } from "../shell/PlotShell";

const ScatterGLSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  x: z.union([z.array(z.number()), z.string()]),
  y: z.union([z.array(z.number()), z.string()]),
  color: z.union([z.array(z.union([z.string(), z.number()])), z.string()]).optional(),
  size: z.union([z.array(z.number()), z.number()]).optional(),
  colormap: z.string().optional(),
  mode: z.enum(["markers", "lines", "lines+markers"]).optional(),
  title: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().positive().optional(),
});

export const ScatterGL = defineComponent({
  name: "ScatterGL",
  props: ScatterGLSchema,
  description:
    "WebGL-accelerated scatter — same API as Scatter but renders thousands to millions of points without choking the canvas. Use for high-cardinality scatter (>10k points). Loses some text-rendering features but is dramatically faster.",
  component: ({ props }) => {
    const r = resolve({
      data: props.data ?? undefined,
      x: props.x,
      y: props.y,
      color: props.color,
    });
    if (!r) return null;
    if (r.color) {
      const trace: Data = {
        type: "scattergl",
        mode: props.mode ?? "markers",
        x: r.x as number[],
        y: r.y as number[],
        marker: {
          color: r.color,
          colorscale: resolveColormap(props.colormap ?? "viridis") as never,
          size: (props.size as never) ?? 4,
          showscale: true,
        },
      };
      const layout: Partial<Layout> = buildAxisLayout(props) as Partial<Layout>;
      return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
    }
    const groups = splitByGroup(r);
    const traces: Data[] = groups.map((g) => ({
      type: "scattergl",
      mode: props.mode ?? "markers",
      x: g.x as number[],
      y: g.y as number[],
      name: g.group || undefined,
      marker: { size: (props.size as never) ?? 4 },
    }));
    const layout: Partial<Layout> = {
      ...(buildAxisLayout(props) as Partial<Layout>),
      showlegend: groups.length > 1 && groups[0]!.group !== "",
    };
    return React.createElement(PlotShell, { data: traces, layout, height: props.height });
  },
});
