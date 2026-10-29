import { z } from "zod/v4";
import { color } from "../style";

export const LineSchema = z.object({ x1: z.number(), y1: z.number(), x2: z.number(), y2: z.number(), stroke: color.optional(), strokeWidth: z.number().optional(), opacity: z.number().optional() });

export type LineProps = z.infer<typeof LineSchema>;
