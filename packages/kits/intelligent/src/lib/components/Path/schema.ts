import { z } from "zod/v4";
import { paint } from "../svgHelpers";

export const PathSchema = z.object({ d: z.string(), ...paint });

export type PathProps = z.infer<typeof PathSchema>;
