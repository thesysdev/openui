import { z } from "zod/v4";

export const HtmlViewSchema = z.object({
  html: z.string(),
  height: z.number().optional(),
  title: z.string().optional(),
});

export type HtmlViewProps = z.infer<typeof HtmlViewSchema>;
