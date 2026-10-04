import { z } from "zod/v4";

export const buttonPropsSchema = z.object({
  label: z.string(),
  action: z.any().optional(),
  variant: z.enum(["primary", "secondary", "tertiary"]).optional(),
  type: z.enum(["normal", "destructive"]).optional(),
  size: z.enum(["extra-small", "small", "medium", "large"]).optional(),
});

export type ButtonProps = z.infer<typeof buttonPropsSchema>;
