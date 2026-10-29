import { z } from "zod/v4";
import { children, color } from "../style";

/** Text, or a run of strings and inline components such as Icon, Badge, Link or Math. */
export const richText = z.union([z.string(), children]);

export const TextSchema = z.object({
  text: richText,
  size: z.enum(["xs", "sm", "md", "lg"]).optional(),
  color: color.optional(),
  weight: z.enum(["normal", "medium", "semibold"]).optional(),
  italic: z.boolean().optional(),
  lineThrough: z.boolean().optional(),
  tabularNums: z.boolean().optional(),
  maxLines: z.number().optional(),
});

export type TextProps = z.infer<typeof TextSchema>;
