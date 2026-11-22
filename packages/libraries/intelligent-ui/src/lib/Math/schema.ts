import { z } from "zod/v4";

export const MathSchema = z.object({ tex: z.string(), inline: z.boolean().optional() });

export type MathProps = z.infer<typeof MathSchema>;
