"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import type { CSSProperties } from "react";
import { RadialChart } from "../../../../../components/Charts/RadialChart";
import { DASHBOARD_CHART_PALETTE } from "../../shared/chartPalette";
import { buildSliceData, DASHBOARD_CHART_HEIGHT } from "../chartHelpers";
import { radialChartPropsSchema, type RadialChartProps } from "./schema";

function RadialChartRenderer({ props }: ComponentRenderProps<RadialChartProps>) {
  const data = buildSliceData(props.labels, props.values);
  if (!data.length) return null;
  const style = {
    "--openui-dashboard-chart-height": `${DASHBOARD_CHART_HEIGHT}px`,
  } as CSSProperties;

  return (
    <div style={style}>
      <RadialChart
        data={data}
        categoryKey="category"
        dataKey="value"
        customPalette={DASHBOARD_CHART_PALETTE}
        className="openui-dashboard-radial-chart"
        isAnimationActive={false}
        height="fit-content"
        maxChartSize={DASHBOARD_CHART_HEIGHT}
      />
    </div>
  );
}

export const RadialChartComponent = defineComponent({
  name: "RadialChart",
  props: radialChartPropsSchema,
  description: "Radial bars; use plucked arrays: RadialChart(data.categories, data.values).",
  component: RadialChartRenderer,
});
