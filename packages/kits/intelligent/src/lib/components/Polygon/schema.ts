import { z } from "zod/v4";
import { paint } from "../svgHelpers";

export const PolygonSchema = z.object({ points: z.string(), ...paint });

export type PolygonProps = z.infer<typeof PolygonSchema>;
