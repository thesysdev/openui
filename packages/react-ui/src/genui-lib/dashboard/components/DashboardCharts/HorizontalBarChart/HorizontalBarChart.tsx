"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { HorizontalBarChart } from "../../../../../components/Charts/HorizontalBarChart";
import { DASHBOARD_CHART_PALETTE } from "../../shared/chartPalette";
import { buildChartData, DASHBOARD_CHART_HEIGHT } from "../chartHelpers";
import { horizontalBarChartPropsSchema, type HorizontalBarChartProps } from "./schema";

function HorizontalBarChartRenderer({ props }: ComponentRenderProps<HorizontalBarChartProps>) {
  const data = buildChartData(props.labels, props.series);
  if (!data.length) return null;

  return (
    <HorizontalBarChart
      data={data}
      categoryKey="category"
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
