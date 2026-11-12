import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
import { goodWhenSchema } from "../../../shared/schema";

export const goalPropsSchema = z.object({
  label: z.string(),
  value: z.number(),
  target: z.number(),
  format: formatSchema.optional(),
  pace: z.number().optional(),
  goodWhen: goodWhenSchema.optional(),
  previous: z.number().optional(),
});
export type GoalSchemaProps = z.infer<typeof goalPropsSchema>;
