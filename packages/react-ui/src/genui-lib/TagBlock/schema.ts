import { z } from "zod/v4";

export const TagBlockSchema = z.object({
  tags: z.array(z.string()),
});
