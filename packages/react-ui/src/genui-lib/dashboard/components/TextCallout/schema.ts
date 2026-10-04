import { z } from "zod/v4";

export const textCalloutPropsSchema = z.object({
  variant: z.enum(["neutral", "info", "warning", "success", "danger"]).default("neutral"),
  title: z.string().default(""),
  description: z.string().default(""),
});

export type TextCalloutProps = z.infer<typeof textCalloutPropsSchema>;
