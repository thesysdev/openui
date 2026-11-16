import { action } from "@openuidev/react-lang";
import { z } from "zod/v4";

export const IconButtonSchema = z.object({
  icon: z.string(),
  action: action().optional(),
  label: z.string().optional(),
  variant: z.enum(["outline", "ghost", "solid"]).optional(),
});

export type IconButtonProps = z.infer<typeof IconButtonSchema>;
