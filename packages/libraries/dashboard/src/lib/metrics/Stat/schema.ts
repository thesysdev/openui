import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
import { goodWhenSchema } from "../../../shared/schema";

export const statPropsSchema = z.object({
  value: z.number().nullable(),
  format: formatSchema.optional(),
  previous: z.number().nullable().optional(),
  goodWhen: goodWhenSchema.optional(),
  label: z.string().optional(),
});
export type StatSchemaProps = z.infer<typeof statPropsSchema>;
