import { z } from "zod/v4";
import { stateSchema } from "../../../shared/schema";

export const statusTimelinePropsSchema = z.object({
  labels: z.array(z.string()),
  periods: z.array(z.string()),
  states: z.array(stateSchema),
});
export type StatusTimelineSchemaProps = z.infer<typeof statusTimelinePropsSchema>;
