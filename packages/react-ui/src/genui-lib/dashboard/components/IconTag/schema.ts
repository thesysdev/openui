import { z } from "zod/v4";
import { IconComponent } from "../Icon/Icon";

export const iconTagPropsSchema = z.object({
  icon: IconComponent.ref,
  size: z.enum(["xs", "s", "m", "l", "xl"]).default("m"),
  variant: z
    .enum(["neutral", "info", "success", "warning", "danger", "inverted"])
    .default("neutral"),
});

export type IconTagProps = z.infer<typeof iconTagPropsSchema>;
