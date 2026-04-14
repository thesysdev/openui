"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod/v4";
import { BarChartCondensed as BarChartCondensedComponent } from "../../components/Charts";
import { buildChartData, hasAllProps } from "../helpers";
import { SeriesSchema } from "./Series";

export const BarChartCondensedSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesSchema),
  variant: z.enum(["grouped", "stacked"]).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
});

export const BarChartCondensed = defineComponent({
  name: "BarChart",
  props: BarChartCondensedSchema,
  description: "Vertical bars; use for comparing values across categories with one or more series",
  component: ({ props }) => {
    if (!hasAllProps(props as Record<string, unknown>, "labels", "series")) return null;
    const data = buildChartData(props.labels, props.series);
    if (!data.length) return null;
    return React.createElement(BarChartCondensedComponent, {
      data,
      categoryKey: "category",
      variant: props.variant as "grouped" | "stacked" | undefined,
      xAxisLabel: props.xLabel,
      yAxisLabel: props.yLabel,
      isAnimationActive: false,
    });
  },
});
