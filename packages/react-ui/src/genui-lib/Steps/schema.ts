import { z } from "zod/v4";

export const StepsItemSchema = z.object({
  title: z.string(),
  details: z.string(),
});
