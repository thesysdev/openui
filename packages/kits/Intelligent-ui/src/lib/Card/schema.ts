import { z } from "zod/v4";
import { children } from "../helpers";

export const CardSchema = z.object({
  children,
  variant: z.enum(["outline", "soft"]).optional(),
  padding: z.number().optional(),
  gap: z.number().optional(),
});

export type CardProps = z.infer<typeof CardSchema>;
