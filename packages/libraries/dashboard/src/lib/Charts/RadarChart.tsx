"use client";

import { RadarChart } from "@openuidev/react-components";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { DASHBOARD_CHART_PALETTE } from "./chartPalette";
import { SeriesComponent } from "./dataComponents";
import { buildChartData, DASHBOARD_CHART_HEIGHT } from "./helpers";
export const radarChartPropsSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesComponent.ref).default([]),
  variant: z.enum(["line", "area"]).optional(),
  legend: z.boolean().optional(),
});

export type RadarChartProps = z.infer<typeof radarChartPropsSchema>;

function RadarChartRenderer({ props }: ComponentRenderProps<RadarChartProps>) {
  const data = buildChartData(props.labels, props.series);
  if (!data.length) return null;

  return (
    <RadarChart
      data={data}
      categoryKey="category"
      customPalette={DASHBOARD_CHART_PALETTE}
      variant={props.variant}
      legend={props.legend}
      isAnimationActive={false}
      maxChartSize={DASHBOARD_CHART_HEIGHT}
    />
  );
}

export const RadarChartComponent = defineComponent({
  name: "RadarChart",
  props: radarChartPropsSchema,
  description:
    'Spider/web chart; use for comparing multiple variables across one or more entities. variant "line" (default) draws outlines; "area" fills them. legend false hides the legend.',
  component: RadarChartRenderer,
});
