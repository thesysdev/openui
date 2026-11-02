"use client";

import { RadialChart } from "@openuidev/react-components";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { DASHBOARD_CHART_PALETTE } from "./chartPalette";
import { buildSliceData, DASHBOARD_CHART_HEIGHT } from "./helpers";
export const radialChartPropsSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
});

export type RadialChartProps = z.infer<typeof radialChartPropsSchema>;

function RadialChartRenderer({ props }: ComponentRenderProps<RadialChartProps>) {
  const data = buildSliceData(props.labels, props.values);
  if (!data.length) return null;

  return (
    <RadialChart
      data={data}
      categoryKey="category"
      dataKey="value"
      customPalette={DASHBOARD_CHART_PALETTE}
      isAnimationActive={false}
      height="fit-content"
      maxChartSize={DASHBOARD_CHART_HEIGHT}
    />
  );
}

export const RadialChartComponent = defineComponent({
  name: "RadialChart",
  props: radialChartPropsSchema,
  description: "Radial bars; use plucked arrays: RadialChart(data.categories, data.values).",
  component: RadialChartRenderer,
});
