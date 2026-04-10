import { z } from "zod/v4";

export const ImageSchema = z.object({
  alt: z.string(),
  src: z.string().optional(),
});
