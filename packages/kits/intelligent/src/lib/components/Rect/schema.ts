import { z } from "zod/v4";
import { paint } from "../svgHelpers";

export const RectSchema = z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number(), ...paint, rx: z.number().optional() });

export type RectProps = z.infer<typeof RectSchema>;
