import { z } from "zod/v4";

export const ImageTextLargeSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  bold: z.boolean().default(false),
});
export type ImageTextLargeProps = z.infer<typeof ImageTextLargeSchema>;
