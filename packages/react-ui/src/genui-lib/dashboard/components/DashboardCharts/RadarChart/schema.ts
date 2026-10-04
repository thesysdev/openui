import { z } from "zod/v4";
import { SeriesComponent } from "../dataComponents";

export const radarChartPropsSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesComponent.ref).default([]),
});

export type RadarChartProps = z.infer<typeof radarChartPropsSchema>;
