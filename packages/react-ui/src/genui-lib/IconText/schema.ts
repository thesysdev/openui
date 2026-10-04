import { z } from "zod/v4";
import { Icon } from "../Icon";

export const IconTextSchema = z.object({
  icon: Icon.ref,
  iconVariant: z
    .enum(["neutral", "info", "success", "warning", "danger", "inverted", "filled", "soft"])
    .default("neutral"),
  iconSize: z.enum(["xs", "s", "m", "l", "xl", "sm", "md", "lg"]).default("m"),
  title: z.string(),
  subtitle: z.string().optional(),
  bold: z.boolean().default(false),
  layout: z.enum(["horizontal", "vertical"]).default("horizontal"),
});
export type IconTextProps = z.infer<typeof IconTextSchema>;
