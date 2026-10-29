import { action } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { children, color, radiusSchema } from "../style";

export const PressableSchema = z.object({
  children,
  action: action().optional(),
  selected: z.boolean().optional(),
  padding: z.number().optional(),
  background: color.optional(),
  radius: radiusSchema.optional(),
});

export type PressableProps = z.infer<typeof PressableSchema>;
