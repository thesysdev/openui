import { z } from "zod/v4";

export const ImageTextSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  bold: z.boolean().default(false),
  layout: z.enum(["horizontal", "vertical"]).default("horizontal"),
  imageSize: z.number().optional(),
});
export type ImageTextProps = z.infer<typeof ImageTextSchema>;
