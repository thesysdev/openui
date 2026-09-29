"use client";

import { defineComponent, useIsQueryLoading } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod/v4";
import { PieChart as PieChartComponent } from "../../components/Charts";
import { PieChartSkeleton } from "../../components/Skeleton";
import { asArray, buildSliceData } from "../helpers";

export const PieChartSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
  variant: z.enum(["pie", "donut"]).optional(),
  appearance: z.enum(["circular", "semiCircular"]).optional(),
});

export const PieChart = defineComponent({
  name: "PieChart",
  props: PieChartSchema,
  description: "Circular slices; use plucked arrays: PieChart(data.categories, data.values)",
  component: ({ props }) => {
    const isQueryLoading = useIsQueryLoading();
    const labels = asArray(props.labels) as string[];
    const values = asArray(props.values) as number[];
    const variant = (props.variant as "pie" | "donut") ?? "pie";
    const appearance = (props.appearance as "circular" | "semiCircular") ?? "circular";

    // New format: labels[] + values[]
    if (labels.length > 0 && values.length > 0) {
      const data = labels.map((cat, i) => ({
        category: cat,
        value: typeof values[i] === "number" ? values[i] : 0,
      }));
      return React.createElement(PieChartComponent, {
        data,
        categoryKey: "category",
        dataKey: "value",
        variant,
        appearance,
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
        variant,
        appearance,
        isAnimationActive: false,
      });
    }

    if (isQueryLoading) {
      return React.createElement(PieChartSkeleton, {
        variant,
        appearance,
      });
    }

    return null;
  },
});
