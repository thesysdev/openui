import { z } from "zod/v4";

export const BadgeSchema = z.object({
  text: z.string(),
  color: z.enum(["neutral", "info", "success", "warning", "danger", "purple", "pink"]).optional(),
  icon: z.string().optional(),
});

export type BadgeProps = z.infer<typeof BadgeSchema>;
