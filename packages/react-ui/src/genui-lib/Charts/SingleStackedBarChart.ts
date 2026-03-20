"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod";
import { SingleStackedBar as SingleStackedBarChartComponent } from "../../components/Charts";
import { buildSliceData, hasAllProps } from "../helpers";
import { SliceSchema } from "./Slice";

export const SingleStackedBarChartSchema = z.object({
  slices: z.array(SliceSchema),
});

export const SingleStackedBarChart = defineComponent({
  name: "SingleStackedBarChart",
  props: SingleStackedBarChartSchema,
  description:
    "Single horizontal stacked bar; use for showing part-to-whole proportions in one row",
  component: ({ props }) => {
    if (!hasAllProps(props as Record<string, unknown>, "slices")) return null;

    // FIX: guard against partial streaming data
    if (!Array.isArray((props as any).slices)) return null;

    const data = buildSliceData((props as any).slices);

    // FIX: ensure valid data before rendering (prevents recharts crash)
    if (!Array.isArray(data) || data.length === 0) return null;

    return React.createElement(SingleStackedBarChartComponent, {
      data,
      categoryKey: "category",
      dataKey: "value",
    });
  },
});
