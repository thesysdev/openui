import { z } from "zod/v4";

export const progressPropsSchema = z.object({
  target: z.number(),
});
export type ProgressSchemaProps = z.infer<typeof progressPropsSchema>;
