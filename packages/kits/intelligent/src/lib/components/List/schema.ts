import { z } from "zod/v4";
import { children } from "../style";

type RefComponent = { ref: any };

export const ListItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  marker: z.string().optional(),
  children: children.optional(),
});

export type ListItemProps = z.infer<typeof ListItemSchema>;

export function createListSchema(ListItem: RefComponent) {
  return z.object({
    items: z.array(z.union([z.string(), ListItem.ref])),
    marker: z.enum(["bullet", "number", "none"]).optional(),
    timeline: z.boolean().optional(),
  });
}

export type ListProps = z.infer<ReturnType<typeof createListSchema>>;
