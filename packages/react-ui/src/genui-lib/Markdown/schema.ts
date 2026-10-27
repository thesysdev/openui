import { z } from "zod/v4";

export const MarkdownSchema = z.object({
  textMarkdown: z.string(),
});
