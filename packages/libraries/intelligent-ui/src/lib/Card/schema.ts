import { z } from "zod/v4";
import { children } from "../schemas";

export const CardSchema = z.object({
  children,
  variant: z.enum(["outline", "soft"]).optional(),
  gap: z.number().optional(),
  padding: z.number().optional(),
});

export type CardProps = z.infer<typeof CardSchema>;
