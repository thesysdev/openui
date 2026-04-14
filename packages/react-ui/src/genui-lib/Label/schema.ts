import { z } from "zod/v4";

export const LabelSchema = z.object({
  text: z.string(),
});
