import { z } from "zod/v4";

export const ImageBlockSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
});
