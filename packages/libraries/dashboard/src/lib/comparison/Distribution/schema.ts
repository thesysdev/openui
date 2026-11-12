import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";

export const distributionPropsSchema = z.object({
  labels: z.array(z.string()),
  mins: z.array(z.number()),
  q1s: z.array(z.number()),
  medians: z.array(z.number()),
  q3s: z.array(z.number()),
  maxes: z.array(z.number()),
  format: formatSchema.optional(),
});
export type DistributionSchemaProps = z.infer<typeof distributionPropsSchema>;
