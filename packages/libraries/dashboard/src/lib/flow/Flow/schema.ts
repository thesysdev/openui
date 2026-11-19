import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
export const flowPropsSchema = z.object({
  from: z.array(z.string()),
  to: z.array(z.string()),
  values: z.array(z.number()),
  format: formatSchema.optional(),
  previous: z.array(z.number()).optional(),
});
export type FlowSchemaProps = z.infer<typeof flowPropsSchema>;
