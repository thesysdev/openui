"use client";

import { LegendStoreProvider, PieChart, StackedLegend } from "@openuidev/react-components";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { useId } from "react";
import { z } from "zod/v4";
import { DASHBOARD_CHART_PALETTE } from "./chartPalette";
import { DASHBOARD_CHART_HEIGHT, buildSliceData } from "./helpers";
export const pieChartPropsSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
  variant: z.enum(["pie", "donut"]).optional(),
  legendVariant: z.enum(["default", "stacked"]).optional(),
  height: z.union([z.number(), z.string()]).default(DASHBOARD_CHART_HEIGHT),
  appearance: z.enum(["circular", "semiCircular"]).optional(),
  format: z.enum(["percentage", "number"]).optional(),
  legend: z.boolean().optional(),
});

export type PieChartProps = z.infer<typeof pieChartPropsSchema>;

const MIN_DASHBOARD_CHART_HEIGHT = 160;
// Cap the stacked legend's height so a long category list
// can't crowd out the chart. StackedLegend has its own overflow scroll
// affordance (see StackedLegendView), so a bounded max-height simply hands it
// its built-in scroll gate rather than growing unbounded.
const STACKED_LEGEND_MAX_HEIGHT = 140;

function getDashboardChartHeight(height: unknown) {
  if (typeof height !== "number" || !Number.isFinite(height)) {
    return DASHBOARD_CHART_HEIGHT;
  }

  return Math.min(DASHBOARD_CHART_HEIGHT, Math.max(MIN_DASHBOARD_CHART_HEIGHT, height));
}

function PieChartRenderer({ props }: ComponentRenderProps<PieChartProps>) {
  // Unique legend-store key per renderer instance (a dashboard can hold several
  // pies, so keys must not collide). Computed unconditionally (hooks rule) and
  // only consumed on the stacked branch below. When 'stacked' is requested —
  // cardShell.tsx injects it into medium-card pies — we compose react-components'
  // addressable StackedLegend around the chart rather than use the chart's own
  // legendVariant: the composed legend always sits below the chart, its height is
  // capped, and it shows values in the chart's `format`, where the built-in one
  // goes beside the chart from 400px and always shows percentages. The keyed
  // LegendStoreProvider supplies `legendKey` to both the chart and <StackedLegend>.
  const uid = useId();

  const data = buildSliceData(props.labels, props.values);
  if (!data.length) return null;

  const chartHeight = getDashboardChartHeight(props.height);

  const isStacked = props.legendVariant === "stacked";

  const chart = (
    <PieChart
      data={data}
      categoryKey="category"
      dataKey="value"
      customPalette={DASHBOARD_CHART_PALETTE}
      variant={props.variant}
      appearance={props.appearance}
      format={props.format}
      legend={props.legend}
      isAnimationActive={false}
      height="fit-content"
      maxChartSize={chartHeight}
    />
  );

  if (!isStacked || props.legend === false) return chart;

  return (
    <div>
      <LegendStoreProvider legendKey={uid}>
        {chart}
        <StackedLegend style={{ maxHeight: STACKED_LEGEND_MAX_HEIGHT, overflowY: "auto" }} />
      </LegendStoreProvider>
    </div>
  );
}

export const PieChartComponent = defineComponent({
  name: "PieChart",
  props: pieChartPropsSchema,
  description:
    'Pie or donut slices; supports circular or semiCircular appearance. Use plucked arrays: PieChart(data.categories, data.values). format shows values as "number" (default) or "percentage" in the tooltip, and in the legend inside a MediumCard; legend false hides the legend.',
  component: PieChartRenderer,
});
