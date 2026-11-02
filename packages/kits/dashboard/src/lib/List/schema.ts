import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { IconComponent } from "../Icon";
export const listItemPropsSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  icon: z.optional(IconComponent.ref),
});

export const ListItemComponent = defineComponent({
  name: "ListItem",
  props: listItemPropsSchema,
  description:
    'One List row. icon shows only when the List variant is "icon"; in the default "number" variant rows are numbered and icon is ignored.',
  component: () => null,
});

export const listPropsSchema = z.object({
  items: z.array(ListItemComponent.ref).default([]),
  variant: z.enum(["icon", "number"]).default("number"),
  heading: z.string().optional(),
  description: z.string().optional(),
});

export type ListProps = z.infer<typeof listPropsSchema>;
