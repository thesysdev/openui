import { z } from "zod/v4";
import { IconComponent } from "../Icon/Icon";

export const iconTextPropsSchema = z.object({
  icon: IconComponent.ref,
  iconVariant: z
    .enum(["neutral", "info", "success", "warning", "danger", "inverted"])
    .default("neutral"),
});

export type IconTextProps = z.infer<typeof iconTextPropsSchema>;
