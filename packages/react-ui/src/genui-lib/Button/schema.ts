import { z } from "zod/v4";
import { actionPropSchema } from "../Action/schema";
import { Icon } from "../Icon";

export const ButtonSchema = z.object({
  label: z.string(),
  action: actionPropSchema.optional(),
  variant: z.enum(["primary", "secondary", "tertiary"]).optional(),
  type: z.enum(["normal", "destructive"]).optional(),
  // "default" | "large". Older sizes from earlier responses ("small", etc.)
  // are reported as a type mismatch but still render as default.
  size: z.enum(["default", "large"]).optional(),
  leading: z.optional(Icon.ref),
});
