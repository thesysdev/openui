import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
import { numbersSchema } from "../../../shared/schema";
export const cohortsPropsSchema = z.object({
  cohorts: z.array(z.string()),
  periods: z.array(z.string()),
  values: numbersSchema,
  sizes: z.array(z.number()).optional(),
  format: formatSchema.optional(),
  view: z.enum(["percent", "people"]).optional(),
  showValues: z.boolean().optional(),
});
export type CohortsSchemaProps = z.infer<typeof cohortsPropsSchema>;
