import { z } from "zod/v4";
import { color } from "../style";

export const PolylineSchema = z.object({ points: z.string(), stroke: color.optional(), strokeWidth: z.number().optional(), fill: color.optional(), opacity: z.number().optional() });

export type PolylineProps = z.infer<typeof PolylineSchema>;
