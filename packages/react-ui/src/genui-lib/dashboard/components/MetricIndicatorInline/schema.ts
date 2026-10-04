import { z } from "zod/v4";

export const metricIndicatorTrendSchema = z.object({
  direction: z.enum(["up", "down"]),
  value: z.number(),
});

export const metricIndicatorInlinePropsSchema = z.object({
  value: z.string(),
  subtext: z.string().optional(),
  trend: z.optional(metricIndicatorTrendSchema),
});

export type MetricIndicatorInlineProps = z.infer<typeof metricIndicatorInlinePropsSchema>;
