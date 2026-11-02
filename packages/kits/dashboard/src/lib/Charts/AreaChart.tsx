"use client";

import { AreaChart } from "@openuidev/react-components";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { DASHBOARD_CHART_PALETTE } from "./chartPalette";
import { SeriesComponent } from "./dataComponents";
import {
  buildChartData,
  DASHBOARD_CHART_HEIGHT,
  getCondensedCartesianChartHeight,
} from "./helpers";
export const areaChartPropsSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesComponent.ref).default([]),
  variant: z.enum(["linear", "natural", "step"]).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
});

export type AreaChartProps = z.infer<typeof areaChartPropsSchema>;

function AreaChartRenderer({ props }: ComponentRenderProps<AreaChartProps>) {
  const data = buildChartData(props.labels, props.series);
  if (!data.length) return null;

  return (
    <AreaChart
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

export const AreaChartComponent = defineComponent({
  name: "AreaChart",
  props: areaChartPropsSchema,
  description: "Filled area under lines; use for cumulative totals or volume trends over time.",
  component: AreaChartRenderer,
});
