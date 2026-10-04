import { z } from "zod/v4";

export const iconButtonPropsSchema = z.object({
  label: z.string(),
  icon: z.string(),
  category: z.string().optional(),
  action: z.any().optional(),
  variant: z.enum(["primary", "secondary", "tertiary"]).optional(),
  type: z.enum(["normal", "destructive"]).optional(),
  size: z
    .enum(["3-extra-small", "2-extra-small", "extra-small", "small", "medium", "large"])
    .optional(),
  shape: z.enum(["square", "circle"]).optional(),
});

export type IconButtonProps = z.infer<typeof iconButtonPropsSchema>;
