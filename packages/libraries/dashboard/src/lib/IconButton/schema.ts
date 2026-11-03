import { z } from "zod/v4";
import { actionPropSchema } from "../Action/schema";
export const iconButtonPropsSchema = z.object({
  label: z.string(),
  icon: z.string(),
  category: z.string().optional(),
  action: actionPropSchema.optional(),
  variant: z.enum(["primary", "secondary", "tertiary"]).optional(),
  type: z.enum(["normal", "destructive"]).optional(),
  size: z
    .enum(["3-extra-small", "2-extra-small", "extra-small", "small", "medium", "large"])
    .optional(),
  shape: z.enum(["square", "circle"]).optional(),
});

export type IconButtonProps = z.infer<typeof iconButtonPropsSchema>;
