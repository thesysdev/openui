import { z } from "zod/v4";

export const textContentPropsSchema = z.object({
  text: z.string(),
  size: z.enum(["small", "default", "large", "small-heavy", "large-heavy"]).optional(),
});

export type TextContentProps = z.infer<typeof textContentPropsSchema>;
