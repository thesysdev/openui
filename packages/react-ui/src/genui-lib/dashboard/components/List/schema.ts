import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { IconComponent } from "../Icon/Icon";

export const listItemPropsSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  icon: z.optional(IconComponent.ref),
});

export const ListItemComponent = defineComponent({
  name: "ListItem",
  props: listItemPropsSchema,
  description: "",
  component: () => null,
});

export const listPropsSchema = z.object({
  items: z.array(ListItemComponent.ref).default([]),
  variant: z.enum(["icon", "number"]).default("number"),
  heading: z.string().optional(),
  description: z.string().optional(),
});

export type ListProps = z.infer<typeof listPropsSchema>;
export type ListRenderProps = ListProps & { size?: "default" | "small" };
export type ListItemType = ListProps["items"][number];
