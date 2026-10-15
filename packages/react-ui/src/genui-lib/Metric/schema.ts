import { z } from "zod/v4";

export const MetricSchema = z.object({
  value: z.string(),
  delta: z.string().optional(),
  variant: z.enum(["horizontal", "vertical"]).optional(),
  size: z.enum(["sm", "default", "large"]).optional(),
  // Last, so existing positional calls keep their meaning.
  previous: z.string().optional(),
});

export type MetricProps = z.infer<typeof MetricSchema>;
