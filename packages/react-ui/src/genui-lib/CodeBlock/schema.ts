import { z } from "zod/v4";

export const CodeBlockSchema = z.object({
  language: z.string(),
  codeString: z.string(),
});
