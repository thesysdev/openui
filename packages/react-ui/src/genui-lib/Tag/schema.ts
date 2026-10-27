import { z } from "zod/v4";
import { Avatar } from "../Avatar";
import { Emoji } from "../Emoji";
import { Icon } from "../Icon";
import { Shape } from "../Shape";

export const TagSchema = z.object({
  text: z.string(),
  leading: z.optional(z.union([Icon.ref, Avatar.ref, Emoji.ref, Shape.ref])),
  variant: z
    .enum(["neutral", "info", "success", "warning", "danger", "purple", "pink", "inverted"])
    .optional(),
});
