import { z } from "zod/v4";
import { SeriesComponent } from "../dataComponents";

export const barChartPropsSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesComponent.ref).default([]),
  variant: z.enum(["grouped", "stacked"]).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
});

export type BarChartProps = z.infer<typeof barChartPropsSchema>;
