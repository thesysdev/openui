
"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod";
import { LineChart as LineChartCondensedComponent } from "../../components/Charts";
import { buildChartData, hasAllProps } from "../helpers";
import { SeriesSchema } from "./Series";

export const LineChartCondensedSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesSchema),
  variant: z.enum(["linear", "natural", "step"]).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
});

export const LineChartCondensed = defineComponent({
  name: "LineChart",
  props: LineChartCondensedSchema,
  description: "Lines over categories; use for trends and continuous data over time",
  component: ({ props }) => {
    if (!hasAllProps(props as Record<string, unknown>, "labels", "series")) return null;

    // FIX: guard against partial streaming data
    if (!Array.isArray(props.labels) || !Array.isArray(props.series)) return null;

    const data = buildChartData(props.labels, props.series);

    // FIX: ensure valid data before rendering (prevents recharts crash)
    if (!Array.isArray(data) || data.length === 0) return null;

    return React.createElement(LineChartCondensedComponent, {
      data,
      categoryKey: "category",
      variant: props.variant as "linear" | "natural" | "step" | undefined,
      xAxisLabel: props.xLabel,
      yAxisLabel: props.yLabel,
      isAnimationActive: false,
    });
  },
});