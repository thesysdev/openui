import { z } from "zod/v4";
import { IconComponent } from "../Icon/Icon";

export const tagPropsSchema = z.object({
  text: z.string(),
  variant: z.enum(["neutral", "info", "success", "warning", "danger"]).default("neutral"),
  icon: z.optional(IconComponent.ref),
});
