import { z } from "zod/v4";

export const markerPropsSchema = z.object({
  label: z.string(),
  at: z.string(),
});
export type MarkerSchemaProps = z.infer<typeof markerPropsSchema>;
