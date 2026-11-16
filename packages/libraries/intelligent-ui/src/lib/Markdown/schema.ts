import { z } from "zod/v4";

export const MarkdownSchema = z.object({ text: z.string() });

export type MarkdownProps = z.infer<typeof MarkdownSchema>;
