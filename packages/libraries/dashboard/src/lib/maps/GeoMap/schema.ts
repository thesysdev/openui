import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
import { goodWhenSchema } from "../../../shared/schema";
export const geoMapPropsSchema = z.object({
  region: z.enum(["world", "us"]),
  labels: z.array(z.string()),
  values: z.array(z.number()),
  format: formatSchema.optional(),
  previous: z.array(z.number()).optional(),
  goodWhen: goodWhenSchema.optional(),
  limit: z.number().optional(),
  view: z.enum(["count", "total"]).optional(),
});
export type GeoMapSchemaProps = z.infer<typeof geoMapPropsSchema>;
