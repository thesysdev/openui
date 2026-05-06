"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { buildAxisLayout, resolve, splitByGroup } from "../helpers/buildTrace";
import { PlotShell } from "../shell/PlotShell";

const HistogramSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  x: z.union([z.array(z.number()), z.string()]),
  color: z.union([z.array(z.string()), z.string()]).optional(),
  nbinsx: z.number().int().positive().optional(),
  histnorm: z.enum(["", "percent", "probability", "density", "probability density"]).optional(),
  barmode: z.enum(["overlay", "stack", "group"]).optional(),
  title: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Histogram = defineComponent({
  name: "Histogram",
  props: HistogramSchema,
  description:
    "Frequency histogram of a single numeric variable. Pass `x` as a field name (with `data`) or a raw array. `color` enables per-group histograms. `histnorm`: '' (count, default), 'probability', 'density', etc. `nbinsx` overrides Plotly's auto-binning.",
  component: ({ props }) => {
    // Histogram needs only x; treat y as identical to x for resolve().
    const r = resolve({
      data: props.data ?? undefined,
      x: props.x,
      y: props.x,
      color: props.color,
    });
    if (!r) return null;
    const groups = splitByGroup(r);
    const traces: Data[] = groups.map((g) => ({
      type: "histogram",
      x: g.x as number[],
      nbinsx: props.nbinsx,
      histnorm: props.histnorm,
      name: g.group || undefined,
      opacity: groups.length > 1 ? 0.7 : 1,
    }));
    const layout: Partial<Layout> = {
      ...(buildAxisLayout({
        title: props.title,
        xLabel: props.xLabel,
        yLabel: props.yLabel ?? (props.histnorm ? "Density" : "Count"),
      }) as Partial<Layout>),
      barmode: props.barmode ?? (groups.length > 1 ? "overlay" : "group"),
      showlegend: groups.length > 1 && groups[0]!.group !== "",
    };
    return React.createElement(PlotShell, { data: traces, layout, height: props.height });
  },
});
