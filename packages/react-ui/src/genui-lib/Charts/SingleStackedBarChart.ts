"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod/v4";
import { SingleStackedBar as SingleStackedBarChartComponent } from "../../components/Charts";
import { asArray, buildSliceData } from "../helpers";

export const SingleStackedBarChartSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
});

export const SingleStackedBarChart = defineComponent({
  name: "SingleStackedBarChart",
  props: SingleStackedBarChartSchema,
  description:
    "Single horizontal stacked bar; use plucked arrays: SingleStackedBarChart(data.categories, data.values)",
  component: ({ props }) => {
    const labels = asArray(props.labels) as string[];
    const values = asArray(props.values) as number[];

    if (labels.length > 0 && values.length > 0) {
      const data = labels.map((cat, i) => ({
        category: cat,
        value: typeof values[i] === "number" ? values[i] : 0,
      }));
      if (!data.length) return null;
      return React.createElement(SingleStackedBarChartComponent, {
        data,
        categoryKey: "category",
        dataKey: "value",
      });
    }

    const sliceData = buildSliceData(props.labels);
    if (sliceData.length) {
      return React.createElement(SingleStackedBarChartComponent, {
        data: sliceData,
        categoryKey: "category",
        dataKey: "value",
      });
    }

    return null;
  },
});
