import { action } from "@openuidev/react-lang";
import { z } from "zod/v4";

export const ButtonSchema = z.object({
  label: z.string(),
  action: action().optional(),
  variant: z.enum(["solid", "outline", "soft", "ghost"]).optional(),
  color: z.enum(["primary", "danger", "success"]).optional(),
  size: z.enum(["sm", "md", "lg"]).optional(),
  icon: z.string().optional(),
  disabled: z.boolean().optional(),
  block: z.boolean().optional(),
});

export type ButtonProps = z.infer<typeof ButtonSchema>;
