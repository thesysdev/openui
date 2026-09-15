import { z } from "zod/v4";
import { actionPropSchema } from "../Action/schema";
import { Icon } from "../Icon";

export const IconButtonSchema = z.object({
  name: z.string(),
  icon: Icon.ref,
  action: actionPropSchema.optional(),
  variant: z.enum(["primary", "secondary", "tertiary"]).optional(),
  size: z.enum(["extra-small", "small", "medium", "large"]).optional(),
  shape: z.enum(["square", "circle"]).optional(),
});
export type IconButtonProps = z.infer<typeof IconButtonSchema>;
