"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { buildAxisLayout, resolve, splitByGroup } from "../helpers/buildTrace";
import { resolveColormap } from "../shell/colormap";
import { PlotShell } from "../shell/PlotShell";

const ScatterSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  x: z.union([z.array(z.number()), z.string()]),
  y: z.union([z.array(z.number()), z.string()]),
  color: z.union([z.array(z.union([z.string(), z.number()])), z.string()]).optional(),
  size: z.union([z.array(z.number()), z.string(), z.number()]).optional(),
  colormap: z.string().optional(),
  trendline: z.boolean().optional(),
  title: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Scatter = defineComponent({
  name: "Scatter",
  props: ScatterSchema,
  description:
    "Scatter plot. `color` may be a categorical column (string values → discrete colors per group) or a numeric column (continuous coloring via `colormap`, default 'viridis'). `size` accepts a constant, an array, or a field name for variable point size.",
  component: ({ props }) => {
    const r = resolve({
      data: props.data ?? undefined,
      x: props.x,
      y: props.y,
      color: props.color,
    });
    if (!r) return null;

    const sizeArr: number[] | number | undefined = (() => {
      if (typeof props.size === "number") return props.size;
      if (Array.isArray(props.size)) return props.size as number[];
      if (typeof props.size === "string" && props.data) {
        return (props.data as Array<Record<string, unknown>>).map((row) => {
          const v = row[props.size as string];
          return typeof v === "number" ? v : 0;
        });
      }
      return undefined;
    })();

    if (r.color) {
      // Continuous coloring — single trace with colorscale.
      const trace: Data = {
        type: "scatter",
        mode: "markers",
        x: r.x as number[],
        y: r.y as number[],
        marker: {
          color: r.color,
          colorscale: resolveColormap(props.colormap ?? "viridis") as never,
          size: sizeArr ?? 6,
          showscale: true,
        },
      };
      const layout: Partial<Layout> = buildAxisLayout(props) as Partial<Layout>;
      return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
    }

    const groups = splitByGroup(r);
    const traces: Data[] = groups.map((g) => ({
      type: "scatter",
      mode: "markers",
      x: g.x as number[],
      y: g.y as number[],
      name: g.group || undefined,
      marker: { size: sizeArr ?? 6 },
    }));
    const layout: Partial<Layout> = {
      ...(buildAxisLayout(props) as Partial<Layout>),
      showlegend: groups.length > 1 && groups[0]!.group !== "",
    };
    return React.createElement(PlotShell, { data: traces, layout, height: props.height });
  },
});
