"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod";
import { RadialChart as RadialChartComponent } from "../../components/Charts";
import { buildSliceData, hasAllProps } from "../helpers";
import { SliceSchema } from "./Slice";

export const RadialChartSchema = z.object({
  slices: z.array(SliceSchema),
});

export const RadialChart = defineComponent({
  name: "RadialChart",
  props: RadialChartSchema,
  description: "Radial bars showing proportional distribution across named segments",
  component: ({ props }) => {
    if (!hasAllProps(props as Record<string, unknown>, "slices")) return null;

    // FIX: guard against partial streaming data
    if (!Array.isArray((props as any).slices)) return null;

    const data = buildSliceData((props as any).slices);

    // FIX: ensure valid data before rendering (prevents recharts crash)
    if (!Array.isArray(data) || data.length === 0) return null;

    return React.createElement(RadialChartComponent, {
      data,
      categoryKey: "category",
      dataKey: "value",
      isAnimationActive: false,
    });
  },
});
