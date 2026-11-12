import { z } from "zod/v4";

export const statusTimelinePropsSchema = z.object({
  labels: z.array(z.string()),
  states: z.array(z.array(z.string())),
  periods: z.array(z.string()).optional(),
});
export type StatusTimelineSchemaProps = z.infer<typeof statusTimelinePropsSchema>;
