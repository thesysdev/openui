import { z } from "zod/v4";
import { color } from "../style";

export const TitleSchema = z.object({
  text: z.string(),
  size: z.enum(["sm", "md", "lg", "xl", "2xl", "3xl"]).optional(),
  color: color.optional(),
});

export type TitleProps = z.infer<typeof TitleSchema>;
