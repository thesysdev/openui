import { z } from "zod/v4";

export const radialChartPropsSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
});

export type RadialChartProps = z.infer<typeof radialChartPropsSchema>;
