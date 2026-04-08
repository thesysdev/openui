"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod";
import { RadialChart as RadialChartComponent } from "../../components/Charts";
import { asArray, buildSliceData } from "../helpers";

export const RadialChartSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
});

export const RadialChart = defineComponent({
  name: "RadialChart",
  props: RadialChartSchema,
  description: "Radial bars; use plucked arrays: RadialChart(data.categories, data.values)",
  component: ({ props }) => {
    const labels = asArray(props.labels) as string[];
    const values = asArray(props.values) as number[];

    if (labels.length > 0 && values.length > 0) {
      const data = labels.map((cat, i) => ({
        category: cat,
        value: typeof values[i] === "number" ? values[i] : 0,
      }));
      if (!data.length) return null;
      return React.createElement(RadialChartComponent, {
        data,
        categoryKey: "category",
        dataKey: "value",
        isAnimationActive: false,
      });
    }

    const sliceData = buildSliceData(props.labels);
    if (sliceData.length) {
      return React.createElement(RadialChartComponent, {
        data: sliceData,
        categoryKey: "category",
        dataKey: "value",
        isAnimationActive: false,
      });
    }

    return null;
  },
});
