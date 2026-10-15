import { z } from "zod/v4";
import { Avatar } from "../Avatar";
import { AvatarStack } from "../AvatarStack";
import { Emoji } from "../Emoji";
import { Icon } from "../Icon";
import { Shape } from "../Shape";
import { Text } from "../Text";

export const LeadingTextSchema = z.object({
  leading: z.union([Icon.ref, Avatar.ref, AvatarStack.ref, Emoji.ref, Shape.ref]),
  text: Text.ref,
  tone: z.enum(["primary", "secondary"]).optional(),
});

export type LeadingTextProps = z.infer<typeof LeadingTextSchema>;
