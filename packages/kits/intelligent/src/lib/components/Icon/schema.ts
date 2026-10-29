import { z } from "zod/v4";
import { color } from "../style";

export const IconSchema = z.object({
  name: z.string(),
  size: z.enum(["sm", "md", "lg", "xl"]).optional(),
  color: color.optional(),
});

export type IconProps = z.infer<typeof IconSchema>;
