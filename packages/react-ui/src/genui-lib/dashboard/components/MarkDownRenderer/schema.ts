import { z } from "zod/v4";

export const markDownRendererPropsSchema = z.object({
  textMarkdown: z.string(),
});

export type MarkDownRendererProps = z.infer<typeof markDownRendererPropsSchema>;
