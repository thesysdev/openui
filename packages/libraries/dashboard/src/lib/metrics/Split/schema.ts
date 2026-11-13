import { z } from "zod/v4";

export const splitPropsSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
});
export type SplitSchemaProps = z.infer<typeof splitPropsSchema>;
