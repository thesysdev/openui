import { z } from "zod/v4";

export const MetricIndicatorTrendSchema = z.object({
  direction: z.enum(["up", "down"]),
  value: z.number(),
});

export const MetricIndicatorWithStrikethroughSchema = z.object({
  value: z.string(),
  subtext: z.string().optional(),
  previousValue: z.string().optional(),
  trend: MetricIndicatorTrendSchema.optional(),
});

export const MetricIndicatorInlineSchema = z.object({
  value: z.string(),
  subtext: z.string().optional(),
  trend: MetricIndicatorTrendSchema.optional(),
});

export type MetricIndicatorTrend = z.infer<typeof MetricIndicatorTrendSchema>;
export type MetricIndicatorWithStrikethroughProps = z.infer<
  typeof MetricIndicatorWithStrikethroughSchema
>;
export type MetricIndicatorInlineProps = z.infer<typeof MetricIndicatorInlineSchema>;
