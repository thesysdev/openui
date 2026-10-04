import { z } from "zod/v4";

export const textBlockVariantSchema = z.enum([
  "title-text",
  "number-title-text",
  "text-subtext",
  "highlight-text-number-subtext",
  "text",
  "highlight-text",
  "number",
  "highlight-number",
]);

export const textBlockPropsSchema = z.object({
  variant: textBlockVariantSchema.default("title-text"),
  primary: z.string(),
  secondary: z.string().optional(),
  tertiary: z.string().optional(),
  type: z.enum(["text", "number", "textOnly"]).default("text"),
  size: z.enum(["xs", "sm", "md", "lg"]).default("sm"),
  align: z.enum(["left", "center", "right"]).default("left"),
  secondaryMaxLines: z.number().optional(),
  secondaryTone: z.enum(["positive", "negative"]).optional(),
});

export type TextBlockProps = z.infer<typeof textBlockPropsSchema>;
