import { z } from "zod/v4";
import { numbersSchema } from "../../../shared/schema";

export const trendPropsSchema = z.object({
  values: numbersSchema,
  previous: numbersSchema.optional(),
});
export type TrendSchemaProps = z.infer<typeof trendPropsSchema>;
