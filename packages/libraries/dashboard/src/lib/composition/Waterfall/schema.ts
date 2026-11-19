import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
import { goodWhenSchema } from "../../../shared/schema";
export const waterfallPropsSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
  format: formatSchema.optional(),
  endLabel: z.string().optional(),
  goodWhen: goodWhenSchema.optional(),
  subtotals: z.array(z.string()).optional(),
});
export type WaterfallSchemaProps = z.infer<typeof waterfallPropsSchema>;
