import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
import { SeriesComponent as Series } from "../Series";

export const smallMultiplesPropsSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(Series.ref),
  type: z.enum(["line", "area"]).optional(),
  format: formatSchema.optional(),
  columns: z.number().optional(),
});
export type SmallMultiplesSchemaProps = z.infer<typeof smallMultiplesPropsSchema>;
