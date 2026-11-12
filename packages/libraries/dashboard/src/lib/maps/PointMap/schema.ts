import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
import { goodWhenSchema } from "../../../shared/schema";
export const pointMapPropsSchema = z.object({
  region: z.enum(["world", "us"]),
  labels: z.array(z.string()),
  lats: z.array(z.number()),
  lons: z.array(z.number()),
  values: z.array(z.number()),
  format: formatSchema.optional(),
  previous: z.array(z.number()).optional(),
  goodWhen: goodWhenSchema.optional(),
  groups: z.array(z.string()).optional(),
  valueLabel: z.string().optional(),
});
export type PointMapSchemaProps = z.infer<typeof pointMapPropsSchema>;
