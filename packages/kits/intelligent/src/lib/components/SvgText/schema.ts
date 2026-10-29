import { z } from "zod/v4";
import { color } from "../style";

export const SvgTextSchema = z.object({
  text: z.string(),
  x: z.number(),
  y: z.number(),
  size: z.number().optional(),
  fill: color.optional(),
  anchor: z.enum(["start", "middle", "end"]).optional(),
  weight: z.enum(["normal", "medium", "semibold"]).optional(),
});

export type SvgTextProps = z.infer<typeof SvgTextSchema>;
