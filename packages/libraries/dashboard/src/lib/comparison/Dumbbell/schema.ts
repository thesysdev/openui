import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
import { goodWhenSchema } from "../../../shared/schema";

export const dumbbellPropsSchema = z.object({
  labels: z.array(z.string()),
  before: z.array(z.number()),
  after: z.array(z.number()),
  format: formatSchema.optional(),
  beforeLabel: z.string().optional(),
  afterLabel: z.string().optional(),
  goodWhen: goodWhenSchema.optional(),
});
export type DumbbellSchemaProps = z.infer<typeof dumbbellPropsSchema>;
