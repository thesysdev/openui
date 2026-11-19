import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
import { goodWhenSchema } from "../../../shared/schema";

export const intervalsPropsSchema = z.object({
  labels: z.array(z.string()),
  estimates: z.array(z.number()),
  lows: z.array(z.number()),
  highs: z.array(z.number()),
  format: formatSchema.optional(),
  baseline: z.number().optional(),
  baselineLabel: z.string().optional(),
  goodWhen: goodWhenSchema.optional(),
});
export type IntervalsSchemaProps = z.infer<typeof intervalsPropsSchema>;
