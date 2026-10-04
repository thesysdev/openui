import { z } from "zod/v4";
import { ScatterSeriesComponent } from "../dataComponents";

export const scatterChartPropsSchema = z.object({
  datasets: z.array(ScatterSeriesComponent.ref).default([]),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
});

export type ScatterChartProps = z.infer<typeof scatterChartPropsSchema>;
