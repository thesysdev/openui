import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
import { goodWhenSchema } from "../../../shared/schema";

export const keyValuePropsSchema = z.object({
  label: z.string(),
  value: z.union([z.number(), z.string()]),
  format: formatSchema.optional(),
  previous: z.number().nullable().optional(),
  goodWhen: goodWhenSchema.optional(),
});
export type KeyValueSchemaProps = z.infer<typeof keyValuePropsSchema>;
