"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { BarChartCondensed } from "../../../../../components/Charts";
import { DASHBOARD_CHART_PALETTE } from "../../shared/chartPalette";
import {
  buildChartData,
  DASHBOARD_CHART_HEIGHT,
  getCondensedCartesianChartHeight,
} from "../chartHelpers";
import { barChartPropsSchema, type BarChartProps } from "./schema";

function BarChartRenderer({ props }: ComponentRenderProps<BarChartProps>) {
  const data = buildChartData(props.labels, props.series);
  if (!data.length) return null;

  return (
    <BarChartCondensed
      data={data}
      categoryKey="category"
      customPalette={DASHBOARD_CHART_PALETTE}
      variant={props.variant}
      xAxisLabel={props.xLabel}
      yAxisLabel={props.yLabel}
      isAnimationActive={false}
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
