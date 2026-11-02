"use client";

import { BarChart } from "@openuidev/react-components";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { DASHBOARD_CHART_PALETTE } from "./chartPalette";
import { SeriesComponent } from "./dataComponents";
import { buildChartData, DASHBOARD_CHART_HEIGHT } from "./helpers";
export const horizontalBarChartPropsSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesComponent.ref).default([]),
  variant: z.enum(["grouped", "stacked"]).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
});

export type HorizontalBarChartProps = z.infer<typeof horizontalBarChartPropsSchema>;

function HorizontalBarChartRenderer({ props }: ComponentRenderProps<HorizontalBarChartProps>) {
  const data = buildChartData(props.labels, props.series);
  if (!data.length) return null;

  return (
    <BarChart
      data={data}
      categoryKey="category"
      orientation="horizontal"
      customPalette={DASHBOARD_CHART_PALETTE}
      variant={props.variant}
      xAxisLabel={props.xLabel}
      yAxisLabel={props.yLabel}
      isAnimationActive={false}
      height={DASHBOARD_CHART_HEIGHT}
    />
  );
}

export const HorizontalBarChartComponent = defineComponent({
  name: "HorizontalBarChart",
  props: horizontalBarChartPropsSchema,
  description:
    "Horizontal bars; use only when category labels are too long for a vertical BarChart or the user explicitly asks for horizontal bars.",
  component: HorizontalBarChartRenderer,
});
