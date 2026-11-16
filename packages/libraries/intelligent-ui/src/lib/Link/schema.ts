import { z } from "zod/v4";

export const LinkSchema = z.object({ text: z.string(), url: z.string() });

export type LinkProps = z.infer<typeof LinkSchema>;
