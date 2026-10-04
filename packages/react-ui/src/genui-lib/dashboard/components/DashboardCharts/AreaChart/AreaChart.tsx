"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { AreaChartCondensed } from "../../../../../components/Charts/AreaChartCondensed";
import { DASHBOARD_CHART_PALETTE } from "../../shared/chartPalette";
import {
  buildChartData,
  DASHBOARD_CHART_HEIGHT,
  getCondensedCartesianChartHeight,
} from "../chartHelpers";
import { areaChartPropsSchema, type AreaChartProps } from "./schema";

function AreaChartRenderer({ props }: ComponentRenderProps<AreaChartProps>) {
  const data = buildChartData(props.labels, props.series);
  if (!data.length) return null;

  return (
    <AreaChartCondensed
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

export const AreaChartComponent = defineComponent({
  name: "AreaChart",
  props: areaChartPropsSchema,
  description: "Filled area under lines; use for cumulative totals or volume trends over time.",
  component: AreaChartRenderer,
});
