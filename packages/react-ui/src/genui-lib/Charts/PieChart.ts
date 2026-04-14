"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod/v4";
import { PieChart as PieChartComponent } from "../../components/Charts";
import { asArray, buildSliceData } from "../helpers";

export const PieChartSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
  variant: z.enum(["pie", "donut"]).optional(),
});

export const PieChart = defineComponent({
  name: "PieChart",
  props: PieChartSchema,
  description: "Circular slices; use plucked arrays: PieChart(data.categories, data.values)",
  component: ({ props }) => {
    const labels = asArray(props.labels) as string[];
    const values = asArray(props.values) as number[];

    // New format: labels[] + values[]
    if (labels.length > 0 && values.length > 0) {
      const data = labels.map((cat, i) => ({
        category: cat,
        value: typeof values[i] === "number" ? values[i] : 0,
      }));
      if (!data.length) return null;
      return React.createElement(PieChartComponent, {
        data,
        categoryKey: "category",
        dataKey: "value",
        variant: props.variant as "pie" | "donut" | undefined,
        isAnimationActive: false,
      });
    }

    // Legacy fallback: Slice[] objects (backwards compat)
    const sliceData = buildSliceData(props.labels);
    if (sliceData.length) {
      return React.createElement(PieChartComponent, {
        data: sliceData,
        categoryKey: "category",
        dataKey: "value",
        variant: props.variant as "pie" | "donut" | undefined,
        isAnimationActive: false,
      });
    }

    return null;
  },
});
