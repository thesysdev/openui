import { z } from "zod/v4";
import { color } from "../helpers";

export const CaptionSchema = z.object({ text: z.string(), color: color.optional() });

export type CaptionProps = z.infer<typeof CaptionSchema>;
