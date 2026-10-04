import { z } from "zod/v4";
import { TrendComponent } from "../Trend/Trend";

// trend is a Trend(direction, value) child component (positional-only
// authoring). The renderer's `resolveTrend` still accepts the legacy raw
// `{direction, value}` object at runtime, but the schema — what the LLM sees —
// only advertises the child-component form.
export const metricIndicatorPropsSchema = z.object({
  value: z.string(),
  subtext: z.string().optional(),
  trend: z.optional(TrendComponent.ref),
});

export type MetricIndicatorProps = z.infer<typeof metricIndicatorPropsSchema>;
