import { z } from "zod/v4";
import { Avatar } from "../Avatar";
import { Emoji } from "../Emoji";
import { Icon } from "../Icon";
import { ContentChildUnion } from "../unions";

export const TabItemSchema = z.object({
  value: z.string(),
  trigger: z.string(),
  content: z.array(ContentChildUnion),
  leading: z.union([Icon.ref, Avatar.ref, Emoji.ref]).optional(),
});
