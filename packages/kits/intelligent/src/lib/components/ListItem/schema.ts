import { z } from "zod/v4";
import { children } from "../style";

export const ListItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  marker: z.string().optional(),
  children: children.optional(),
});

export type ListItemProps = z.infer<typeof ListItemSchema>;
