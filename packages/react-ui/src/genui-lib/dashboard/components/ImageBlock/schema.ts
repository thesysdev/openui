import { z } from "zod/v4";

export const imageBlockPropsSchema = z.object({
  src: z.string().optional(),
  alt: z.string().default(""),
});

export type ImageBlockProps = z.infer<typeof imageBlockPropsSchema>;
