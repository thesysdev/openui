import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
import { goodWhenSchema } from "../../../shared/schema";

export const leaderboardPropsSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
  format: formatSchema.optional(),
  previous: z.array(z.number()).optional(),
  goodWhen: goodWhenSchema.optional(),
  limit: z.number().optional(),
});
export type LeaderboardSchemaProps = z.infer<typeof leaderboardPropsSchema>;
