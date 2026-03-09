import { z } from "zod";
import { actionSchema } from "../Action/schema";

export { actionSchema, type ActionSchema } from "../Action/schema";

export const ButtonSchema = z.object({
  label: z.string(),
  action: actionSchema,
  variant: z.enum(["primary", "secondary", "tertiary"]).optional(),
  type: z.enum(["normal", "destructive"]).optional(),
  size: z.enum(["extra-small", "small", "medium", "large"]).optional(),
});
