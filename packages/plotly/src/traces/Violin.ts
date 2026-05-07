"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { buildAxisLayout, resolve, splitByGroup } from "../helpers/buildTrace";
import { PlotShell } from "../shell/PlotShell";

const ViolinSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  x: z.union([z.array(z.string()), z.string()]).optional(),
  y: z.union([z.array(z.number()), z.string()]),
  color: z.union([z.array(z.string()), z.string()]).optional(),
  showBox: z.boolean().optional(),
  showPoints: z.union([z.boolean(), z.enum(["all", "outliers", "suspectedoutliers"])]).optional(),
  side: z.enum(["both", "positive", "negative"]).optional(),
  title: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Violin = defineComponent({
  name: "Violin",
  props: ViolinSchema,
  description:
    "Violin plot. Pass `y` (the numeric variable) and optionally `x` (a categorical grouping field/array) to compare distributions across groups. `showBox=true` overlays the box; `showPoints` controls jittered point overlay ('all' | 'outliers' | true | false). For ridgeline-style stacking, set `side='positive'`.",
  component: ({ props }) => {
    // Violin always needs y; x is optional for grouping.
    const r = resolve({
      data: props.data ?? undefined,
      x: props.x ?? props.y,
      y: props.y,
      color: props.color,
    });
    if (!r) return null;
    const groups = splitByGroup(r);
    const points =
      props.showPoints === undefined ? false : props.showPoints === true ? "all" : props.showPoints;
    const traces: Data[] = groups.map((g) => ({
      type: "violin",
      x:
        typeof props.x === "string" || Array.isArray(props.x)
          ? (g.x as Array<string | number>)
          : undefined,
      y: g.y as number[],
      name: g.group || undefined,
      box: { visible: props.showBox ?? true },
      meanline: { visible: true },
      points: points as never,
      side: props.side,
    }));
    const layout = {
      ...(buildAxisLayout(props) as Partial<Layout>),
      showlegend: groups.length > 1 && groups[0]!.group !== "",
      violinmode: "group",
    } as Partial<Layout>;
    return React.createElement(PlotShell, { data: traces, layout, height: props.height });
  },
});
