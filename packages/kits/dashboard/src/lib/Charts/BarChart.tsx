"use client";

import { BarChart } from "@openuidev/react-components";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { DASHBOARD_CHART_PALETTE } from "./chartPalette";
import { SeriesComponent } from "./dataComponents";
import {
  buildChartData,
  DASHBOARD_CHART_HEIGHT,
  getCondensedCartesianChartHeight,
} from "./helpers";
export const barChartPropsSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesComponent.ref).default([]),
  variant: z.enum(["grouped", "stacked"]).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
});

export type BarChartProps = z.infer<typeof barChartPropsSchema>;

function BarChartRenderer({ props }: ComponentRenderProps<BarChartProps>) {
  const data = buildChartData(props.labels, props.series);
  if (!data.length) return null;

  return (
    <BarChart
      data={data}
      categoryKey="category"
      customPalette={DASHBOARD_CHART_PALETTE}
      variant={props.variant}
      xAxisLabel={props.xLabel}
      yAxisLabel={props.yLabel}
      isAnimationActive={false}
      condensed
      height={getCondensedCartesianChartHeight(DASHBOARD_CHART_HEIGHT)}
    />
  );
}

export const BarChartComponent = defineComponent({
  name: "BarChart",
  props: barChartPropsSchema,
  description: "Vertical bars; use for comparing values across categories with one or more series.",
  component: BarChartRenderer,
});
