import { z } from "zod/v4";

export const ImageSchema = z.object({
  alt: z.string(),
  src: z.string().optional(),
  aspectRatio: z.enum(["auto", "1:1", "4:3", "3:2", "16:9", "3:4", "9:16"]).optional(),
});
