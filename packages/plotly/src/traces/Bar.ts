"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { buildAxisLayout, resolve, splitByGroup } from "../helpers/buildTrace";
import { PlotShell } from "../shell/PlotShell";

const BarSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  x: z.union([z.array(z.union([z.string(), z.number()])), z.string()]),
  y: z.union([z.array(z.number()), z.string()]),
  color: z.union([z.array(z.string()), z.string()]).optional(),
  orientation: z.enum(["v", "h"]).optional(),
  barmode: z.enum(["group", "stack", "overlay", "relative"]).optional(),
  title: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Bar = defineComponent({
  name: "Bar",
  props: BarSchema,
  description:
    "Bar chart (Plotly Express style). Two ways to pass data: (1) `data` as an array of objects + `x`/`y` as field names, e.g. Bar(rows, 'month', 'revenue'); (2) `x`/`y` as parallel arrays directly, e.g. Bar(null, ['Jan','Feb','Mar'], [120, 150, 180]). `color` field/array adds grouping. `barmode` controls grouping behaviour: 'group' (default), 'stack', 'overlay', 'relative'.",
  component: ({ props }) => {
    const r = resolve({
      data: props.data ?? undefined,
      x: props.x,
      y: props.y,
      color: props.color,
    });
    if (!r) return null;
    const groups = splitByGroup(r);
    const orientation = props.orientation ?? "v";
    const traces: Data[] = groups.map((g) => ({
      type: "bar",
      orientation,
      x: orientation === "v" ? (g.x as Array<string | number>) : (g.y as number[]),
      y: orientation === "v" ? (g.y as number[]) : (g.x as Array<string | number>),
      name: g.group || undefined,
    }));
    const layout: Partial<Layout> = {
      ...(buildAxisLayout(props) as Partial<Layout>),
      barmode: props.barmode ?? "group",
      showlegend: groups.length > 1 && groups[0]!.group !== "",
    };
    return React.createElement(PlotShell, { data: traces, layout, height: props.height });
  },
});
