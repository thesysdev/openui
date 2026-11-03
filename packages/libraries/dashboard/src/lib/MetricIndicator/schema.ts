import { z } from "zod/v4";
export const metricIndicatorTrendSchema = z.object({
  direction: z.enum(["up", "down"]),
  value: z.number(),
});

export const metricIndicatorPropsSchema = z.object({
  value: z.string(),
  subtext: z.string().optional(),
  trend: metricIndicatorTrendSchema.optional(),
});

export type MetricIndicatorProps = z.infer<typeof metricIndicatorPropsSchema>;
