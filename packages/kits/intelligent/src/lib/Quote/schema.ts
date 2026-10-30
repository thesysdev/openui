import { z } from "zod/v4";

export const QuoteSchema = z.object({ text: z.string(), cite: z.string().optional() });

export type QuoteProps = z.infer<typeof QuoteSchema>;
