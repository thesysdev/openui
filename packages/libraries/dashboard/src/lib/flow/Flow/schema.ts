import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
const linkSchema = z.object({
  from: z.string(),
  to: z.string(),
  value: z.number(),
  previous: z.number().optional(),
});
export const flowPropsSchema = z.object({
  links: z.array(linkSchema),
  format: formatSchema.optional(),
});
export type FlowSchemaProps = z.infer<typeof flowPropsSchema>;
