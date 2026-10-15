import { z } from "zod/v4";
import { actionPropSchema } from "../Action/schema";
import { Icon } from "../Icon";

export const IconButtonSchema = z.object({
  name: z.string(),
  icon: Icon.ref,
  action: actionPropSchema.optional(),
  variant: z.enum(["primary", "secondary", "tertiary"]).optional(),
  // Round only, "default" (32px) | "large" (40px). Older sizes and the old
  // shape argument are dropped by the parser and render at the default.
  size: z.enum(["default", "large"]).optional(),
});
export type IconButtonProps = z.infer<typeof IconButtonSchema>;
