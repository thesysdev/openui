import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
import { goodWhenSchema } from "../../../shared/schema";

const keyValueSchema = z.object({
  label: z.string(),
  value: z.union([z.number(), z.string(), z.literal(null)]),
  format: formatSchema.optional(),
  previous: z.number().nullable().optional(),
  goodWhen: goodWhenSchema.optional(),
});

export const keyValuesPropsSchema = z.object({
  rows: z.array(keyValueSchema),
});
export type KeyValuesSchemaProps = z.infer<typeof keyValuesPropsSchema>;
