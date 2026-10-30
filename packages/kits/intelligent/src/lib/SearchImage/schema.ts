import { z } from "zod/v4";
import { fitSchema, radiusSchema } from "../helpers";

export const SearchImageSchema = z.object({
  query: z.string(),
  aspectRatio: z.number().optional(),
  radius: radiusSchema.optional(),
  fit: fitSchema.optional(),
});

export type SearchImageProps = z.infer<typeof SearchImageSchema>;
