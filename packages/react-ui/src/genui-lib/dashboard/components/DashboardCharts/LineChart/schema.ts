import { z } from "zod/v4";
import { SeriesComponent } from "../dataComponents";

export const lineChartPropsSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesComponent.ref).default([]),
  variant: z.enum(["linear", "natural", "step"]).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
});

export type LineChartProps = z.infer<typeof lineChartPropsSchema>;
