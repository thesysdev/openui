import { z } from "zod/v4";
import { paint } from "../svgHelpers";

export const EllipseSchema = z.object({ cx: z.number(), cy: z.number(), rx: z.number(), ry: z.number(), ...paint });

export type EllipseProps = z.infer<typeof EllipseSchema>;
