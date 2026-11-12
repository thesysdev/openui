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
  valueLabel: z.string().optional(),
  groups: z.array(z.string()).optional(),
  previous: z.array(z.number()).optional(),
  goodWhen: goodWhenSchema.optional(),
});
export type PointMapSchemaProps = z.infer<typeof pointMapPropsSchema>;
