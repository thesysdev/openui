import { z } from "zod/v4";

export const InlineHeaderSchema = z.object({
  heading: z.string(),
  description: z.string().optional(),
});
export type InlineHeaderProps = z.infer<typeof InlineHeaderSchema>;
