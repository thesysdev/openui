import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
import { numbersSchema } from "../../../shared/schema";
export const cohortsPropsSchema = z.object({
  cohorts: z.array(z.string()),
  sizes: z.array(z.number()),
  periods: z.array(z.string()),
  rows: z.array(numbersSchema),
  format: formatSchema.optional(),
  view: z.enum(["percent", "people"]).optional(),
  showValues: z.boolean().optional(),
});
export type CohortsSchemaProps = z.infer<typeof cohortsPropsSchema>;
