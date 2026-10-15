import { z } from "zod/v4";
import { Icon } from "../Icon";
import { Shape } from "../Shape";

export const AvatarSchema = z.object({
  name: z.string(),
  src: z.string().optional(),
  shape: z.enum(["circle", "rounded"]).optional(),
  domain: z.string().optional(),
  size: z.enum(["inline", "md", "lg"]).optional(),
  icon: z.optional(z.union([Icon.ref, Shape.ref])),
  color: z
    .enum(["neutral", "info", "success", "warning", "danger", "purple", "pink", "inverted"])
    .optional(),
});

export type AvatarProps = z.infer<typeof AvatarSchema>;
