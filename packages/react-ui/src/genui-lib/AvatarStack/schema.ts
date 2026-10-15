import { z } from "zod/v4";
import { Avatar } from "../Avatar";

export const AvatarStackSchema = z.object({
  avatars: z.array(Avatar.ref).min(1),
  max: z.number().optional(),
  size: z.enum(["inline", "md", "lg"]).optional(),
});

export type AvatarStackProps = z.infer<typeof AvatarStackSchema>;
