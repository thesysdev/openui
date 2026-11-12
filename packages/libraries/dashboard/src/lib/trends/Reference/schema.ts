import { z } from "zod/v4";

export const referencePropsSchema = z.object({
  label: z.string(),
  value: z.number(),
  axis: z.enum(["x", "y"]).optional(),
});
export type ReferenceSchemaProps = z.infer<typeof referencePropsSchema>;
