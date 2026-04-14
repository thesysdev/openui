import { z } from "zod/v4";

export const RadioItemSchema = z.object({
  label: z.string(),
  description: z.string(),
  value: z.string(),
});
