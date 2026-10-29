import { z } from "zod/v4";
import { paint } from "../svgHelpers";

export const CircleSchema = z.object({ cx: z.number(), cy: z.number(), r: z.number(), ...paint });

export type CircleProps = z.infer<typeof CircleSchema>;
