"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod";
import { HorizontalBarChart as HorizontalBarChartComponent } from "../../components/Charts";
import { buildChartData, hasAllProps } from "../helpers";
import { SeriesSchema } from "./Series";

export const HorizontalBarChartSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesSchema),
  variant: z.enum(["grouped", "stacked"]).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
});

export const HorizontalBarChart = defineComponent({
  name: "HorizontalBarChart",
  props: HorizontalBarChartSchema,
  description: "Horizontal bars; prefer when category labels are long or for ranked lists",
  component: ({ props }) => {
    if (!hasAllProps(props as Record<string, unknown>, "labels", "series")) return null;
    const data = buildChartData(props.labels, props.series);
    if (!data.length) return null;
    return React.createElement(HorizontalBarChartComponent, {
      data,
      categoryKey: "category",
      variant: props.variant as "grouped" | "stacked" | undefined,
      xAxisLabel: props.xLabel,
      yAxisLabel: props.yLabel,
      isAnimationActive: false,
    });
  },
});
