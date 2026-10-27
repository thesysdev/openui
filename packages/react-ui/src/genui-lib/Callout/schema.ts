import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Emoji } from "../Emoji";
import { Icon } from "../Icon";

export const CalloutSchema = z.object({
  // "error" is kept as an alias of "danger" so existing calls still parse.
  variant: z.enum([
    "neutral",
    "info",
    "success",
    "warning",
    "danger",
    "purple",
    "pink",
    "inverted",
    "error",
  ]),
  content: z.string(),
  visible: reactive(z.boolean().optional()),
  icon: z.optional(z.union([Icon.ref, Emoji.ref])),
});
