import { z } from "zod";

export const RadioItemSchema = z.object({
  label: z.string(),
  description: z.string(),
  value: z.string(),
});
