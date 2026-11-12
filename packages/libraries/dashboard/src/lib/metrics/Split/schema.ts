import { z } from "zod/v4";

export const splitPropsSchema = z.object({
  parts: z.array(z.object({ label: z.string(), value: z.number() })),
});
export type SplitSchemaProps = z.infer<typeof splitPropsSchema>;
