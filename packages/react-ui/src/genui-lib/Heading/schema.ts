import { z } from "zod/v4";

export const HeadingSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  size: z.enum(["default", "lg"]).optional(),
});

export type HeadingProps = z.infer<typeof HeadingSchema>;
