"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod/v4";
import { RadarChart as RadarChartComponent } from "../../components/Charts";
import { buildChartData, hasAllProps } from "../helpers";
import { SeriesSchema } from "./Series";

export const RadarChartSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesSchema),
});

export const RadarChart = defineComponent({
  name: "RadarChart",
  props: RadarChartSchema,
  description: "Spider/web chart; use for comparing multiple variables across one or more entities",
  component: ({ props }) => {
    if (!hasAllProps(props as Record<string, unknown>, "labels", "series")) return null;
    const data = buildChartData(props.labels, props.series);
    if (!data.length) return null;
    return React.createElement(RadarChartComponent, {
      data,
      categoryKey: "category",
      isAnimationActive: false,
    });
  },
});
