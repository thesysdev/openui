import { z } from "zod/v4";

export const TextSchema = z.object({
  text: z.string(),
  variant: z.enum(["small", "default", "body", "h1", "h2", "h3"]).optional(),
  emphasis: z.boolean().optional(),
});
