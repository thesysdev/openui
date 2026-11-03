import { z } from "zod/v4";
import { actionPropSchema } from "../Action/schema";
export const buttonPropsSchema = z.object({
  label: z.string(),
  action: actionPropSchema.optional(),
  variant: z.enum(["primary", "secondary", "tertiary"]).optional(),
  type: z.enum(["normal", "destructive"]).optional(),
  size: z.enum(["extra-small", "small", "medium", "large"]).optional(),
});

export type ButtonProps = z.infer<typeof buttonPropsSchema>;
