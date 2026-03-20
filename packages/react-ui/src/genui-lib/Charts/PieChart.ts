"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod";
import { PieChart as PieChartComponent } from "../../components/Charts";
import { buildSliceData, hasAllProps } from "../helpers";
import { SliceSchema } from "./Slice";

export const PieChartSchema = z.object({
  slices: z.array(SliceSchema),
  variant: z.enum(["pie", "donut"]).optional(),
});

export const PieChart = defineComponent({
  name: "PieChart",
  props: PieChartSchema,
  description: "Circular slices showing part-to-whole proportions; supports pie and donut variants",
  component: ({ props }) => {
    if (!hasAllProps(props as Record<string, unknown>, "slices")) return null;

    // FIX: guard against partial streaming data
    if (!Array.isArray(props.slices)) return null;

    const data = buildSliceData(props.slices);

    // FIX: ensure valid data before rendering (prevents recharts crash)
    if (!Array.isArray(data) || data.length === 0) return null;

    return React.createElement(PieChartComponent, {
      data,
      categoryKey: "category",
      dataKey: "value",
      variant: props.variant as "pie" | "donut" | undefined,
      isAnimationActive: false,
    });
  },
});
