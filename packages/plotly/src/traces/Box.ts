"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { buildAxisLayout, resolve, splitByGroup } from "../helpers/buildTrace";
import { PlotShell } from "../shell/PlotShell";

const BoxSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  x: z.union([z.array(z.string()), z.string()]).optional(),
  y: z.union([z.array(z.number()), z.string()]),
  color: z.union([z.array(z.string()), z.string()]).optional(),
  showPoints: z.union([z.boolean(), z.enum(["all", "outliers", "suspectedoutliers"])]).optional(),
  notched: z.boolean().optional(),
  title: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Box = defineComponent({
  name: "Box",
  props: BoxSchema,
  description:
    "Box plot (Q1/median/Q3, 1.5×IQR whiskers, outliers). Pass `y` and optionally `x` (group field/array). `showPoints`: 'all' | 'outliers' (default) | true | false. `notched=true` for confidence-interval notches around the median. Use Violin when distribution shape matters; Box when summary suffices.",
  component: ({ props }) => {
    const r = resolve({
      data: props.data ?? undefined,
      x: props.x ?? props.y,
      y: props.y,
      color: props.color,
    });
    if (!r) return null;
    const groups = splitByGroup(r);
    const points =
      props.showPoints === undefined
        ? "outliers"
        : props.showPoints === true
          ? "all"
          : props.showPoints === false
            ? false
            : props.showPoints;
    const traces: Data[] = groups.map((g) => ({
      type: "box",
      x:
        typeof props.x === "string" || Array.isArray(props.x)
          ? (g.x as Array<string | number>)
          : undefined,
      y: g.y as number[],
      name: g.group || undefined,
      boxpoints: points as never,
      notched: props.notched,
    }));
    const layout: Partial<Layout> = {
      ...(buildAxisLayout(props) as Partial<Layout>),
      showlegend: groups.length > 1 && groups[0]!.group !== "",
      boxmode: "group",
    };
    return React.createElement(PlotShell, { data: traces, layout, height: props.height });
  },
});
