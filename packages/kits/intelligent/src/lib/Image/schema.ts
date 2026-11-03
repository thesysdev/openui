import { z } from "zod/v4";
import { fitSchema, radiusSchema } from "../schemas";

export const ImageSchema = z.object({
  src: z.string(),
  alt: z.string(),
  aspectRatio: z.number().optional(),
  radius: radiusSchema.optional(),
  fit: fitSchema.optional(),
});

export type ImageProps = z.infer<typeof ImageSchema>;
