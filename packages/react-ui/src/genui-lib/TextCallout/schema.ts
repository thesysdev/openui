import { z } from "zod/v4";

export const TextCalloutSchema = z.object({
  variant: z.enum(["neutral", "info", "warning", "success", "danger"]).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});
