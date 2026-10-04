"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import type { CSSProperties } from "react";
import { PieChart } from "../../../../../components/Charts/PieChart";
import { DASHBOARD_CHART_PALETTE } from "../../shared/chartPalette";
import { buildSliceData, DASHBOARD_CHART_HEIGHT } from "../chartHelpers";
import { pieChartPropsSchema, type PieChartProps } from "./schema";

const MIN_DASHBOARD_CHART_HEIGHT = 160;

function getDashboardChartHeight(height: unknown) {
  if (typeof height !== "number" || !Number.isFinite(height)) {
    return DASHBOARD_CHART_HEIGHT;
  }

  return Math.min(DASHBOARD_CHART_HEIGHT, Math.max(MIN_DASHBOARD_CHART_HEIGHT, height));
}

function PieChartRenderer({ props }: ComponentRenderProps<PieChartProps>) {
  const data = buildSliceData(props.labels, props.values);
  if (!data.length) return null;

  const chartHeight = getDashboardChartHeight(props.height);
  const style = {
    "--openui-dashboard-pie-chart-height": `${chartHeight}px`,
  } as CSSProperties;

  return (
    <div className="openui-dashboard-pie-chart" style={style}>
      <PieChart
        data={data}
        categoryKey="category"
        dataKey="value"
        customPalette={DASHBOARD_CHART_PALETTE}
        variant={props.variant}
        legendVariant={props.legendVariant}
        appearance={props.appearance}
        isAnimationActive={false}
        height="fit-content"
        maxChartSize={chartHeight}
      />
    </div>
  );
}

export const PieChartComponent = defineComponent({
  name: "PieChart",
  props: pieChartPropsSchema,
  description:
    "Pie or donut slices; supports circular or semiCircular appearance. Use plucked arrays: PieChart(data.categories, data.values).",
  component: PieChartRenderer,
});
