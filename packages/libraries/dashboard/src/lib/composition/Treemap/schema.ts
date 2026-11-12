import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
export const treemapPropsSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
  groups: z.array(z.string()).optional(),
  format: formatSchema.optional(),
  previous: z.array(z.number()).optional(),
});
export type TreemapSchemaProps = z.infer<typeof treemapPropsSchema>;
