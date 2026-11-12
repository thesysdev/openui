import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
import { numbersSchema } from "../../../shared/schema";
export const heatmapPropsSchema = z.object({
  rows: z.array(z.string()),
  columns: z.array(z.string()),
  values: numbersSchema,
  format: formatSchema.optional(),
  showValues: z.boolean().optional(),
  midpoint: z.number().optional(),
  view: z.enum(["count", "total", "row"]).optional(),
});
export type HeatmapSchemaProps = z.infer<typeof heatmapPropsSchema>;
