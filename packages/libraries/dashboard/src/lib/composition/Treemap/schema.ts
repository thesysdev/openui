import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
export const treemapPropsSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
  format: formatSchema.optional(),
  previous: z.array(z.number()).optional(),
  groups: z.array(z.string()).optional(),
});
export type TreemapSchemaProps = z.infer<typeof treemapPropsSchema>;
