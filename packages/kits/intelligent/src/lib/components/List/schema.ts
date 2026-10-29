import { z } from "zod/v4";
import { ListItem } from "../ListItem";

export const ListSchema = z.object({
  items: z.array(z.union([z.string(), ListItem.ref])),
  marker: z.enum(["bullet", "number", "none"]).optional(),
  timeline: z.boolean().optional(),
});

export type ListProps = z.infer<typeof ListSchema>;
