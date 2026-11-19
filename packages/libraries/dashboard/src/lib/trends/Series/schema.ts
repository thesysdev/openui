import { z } from "zod/v4";
import { numbersSchema } from "../../../shared/schema";

export const seriesPropsSchema = z.object({
  name: z.string(),
  values: numbersSchema,
  previous: numbersSchema.optional(),
  mark: z.enum(["line", "area", "bar"]).optional(),
  lows: numbersSchema.optional(),
  highs: numbersSchema.optional(),
});
export type SeriesSchemaProps = z.infer<typeof seriesPropsSchema>;
