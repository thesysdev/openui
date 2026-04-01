import { z } from "zod";

export const ArtifactCodeBlockSchema = z.object({
  language: z.string(),
  title: z.string(),
  codeString: z.string(),
});

export type ArtifactCodeBlockProps = z.infer<typeof ArtifactCodeBlockSchema>;
