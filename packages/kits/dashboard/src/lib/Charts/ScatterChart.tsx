"use client";

import { ScatterChart } from "@openuidev/react-components";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { DASHBOARD_CHART_PALETTE } from "./chartPalette";
import { ScatterSeriesComponent } from "./dataComponents";
import { DASHBOARD_CHART_HEIGHT, SCATTER_CHART_CHROME_HEIGHT, unwrapProps } from "./helpers";
export const scatterChartPropsSchema = z.object({
  datasets: z.array(ScatterSeriesComponent.ref).default([]),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
});

export type ScatterChartProps = z.infer<typeof scatterChartPropsSchema>;

function ScatterChartRenderer({ props }: ComponentRenderProps<ScatterChartProps>) {
  if (!props.datasets?.length) return null;
  const data = props.datasets.map((dataset) => {
    const datasetProps = unwrapProps<{ name?: string; points?: unknown[] }>(dataset);

    return {
      name: datasetProps.name ?? "",
      data: (datasetProps.points ?? [])
        .map((point) => {
          const pointProps = unwrapProps<{
            x?: number;
            y?: number;
            z?: number;
          }>(point);
          const x = Number(pointProps.x);
          const y = Number(pointProps.y);
          if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
          return {
            x,
            y,
            ...(pointProps.z !== undefined && Number.isFinite(Number(pointProps.z))
              ? { z: Number(pointProps.z) }
              : {}),
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null),
    };
  });

  if (!data.length) return null;
  const totalHeight = DASHBOARD_CHART_HEIGHT + SCATTER_CHART_CHROME_HEIGHT;

  return (
    <ScatterChart
      data={data}
      customPalette={DASHBOARD_CHART_PALETTE}
      xAxisLabel={props.xLabel}
      yAxisLabel={props.yLabel}
      isAnimationActive={false}
      height={totalHeight}
    />
  );
}

export const ScatterChartComponent = defineComponent({
  name: "ScatterChart",
  props: scatterChartPropsSchema,
  description: "X/Y scatter plot; use for correlations, distributions, and clustering.",
  component: ScatterChartRenderer,
});
