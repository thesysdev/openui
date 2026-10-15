import { z } from "zod/v4";

export const EmojiSchema = z.object({
  emoji: z.string(),
  label: z.string().optional(),
});

export type EmojiProps = z.infer<typeof EmojiSchema>;
