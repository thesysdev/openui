import { z } from "zod/v4";

export const calloutPropsSchema = z.object({
  variant: z.enum(["neutral", "danger", "info", "warning", "success"]).default("neutral"),
  title: z.string().default(""),
  description: z.string().default(""),
});

export type CalloutProps = z.infer<typeof calloutPropsSchema>;
