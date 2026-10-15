"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod/v4";
import { LineChartCondensed as LineChartCondensedComponent } from "../../components/Charts";
import { buildChartData, hasAllProps } from "../helpers";
import { SeriesSchema } from "./Series";
import { SPARKLINE_MAX_HEIGHT, Sparkline } from "./Sparkline";

export const LineChartCondensedSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesSchema),
  variant: z.enum(["linear", "natural", "step"]).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().optional(),
});

export const LineChartCondensed = defineComponent({
  name: "LineChart",
  props: LineChartCondensedSchema,
  description:
    "Lines over categories; use for trends and continuous data over time. A height of 120 or less draws a sparkline with no axes, legend or grid, scaled to the data, for a KPI Card.",
  component: ({ props }) => {
    if (!hasAllProps(props as Record<string, unknown>, "labels", "series")) return null;
    const data = buildChartData(props.labels, props.series);
    if (!data.length) return null;
    // Too short for axes and a legend: draw a full-width sparkline instead.
    if (typeof props.height === "number" && props.height <= SPARKLINE_MAX_HEIGHT) {
      return React.createElement(Sparkline, {
        data,
        height: props.height,
        variant: props.variant as "linear" | "natural" | "step" | undefined,
        kind: "line",
      });
    }
    return React.createElement(LineChartCondensedComponent, {
      data,
      categoryKey: "category",
      variant: props.variant as "linear" | "natural" | "step" | undefined,
      xAxisLabel: props.xLabel,
      yAxisLabel: props.yLabel,
      height: props.height as number | undefined,
      isAnimationActive: false,
    });
  },
});
