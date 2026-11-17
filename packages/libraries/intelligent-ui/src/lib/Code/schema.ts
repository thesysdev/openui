import { z } from "zod/v4";

export const CodeSchema = z.object({ code: z.string(), language: z.string().optional() });

export type CodeProps = z.infer<typeof CodeSchema>;
