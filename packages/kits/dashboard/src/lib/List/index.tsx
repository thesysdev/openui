"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { List } from "../../components/List";
import { listPropsSchema, type ListProps } from "./schema";
export { ListItemComponent } from "./schema";

function ListRenderer({ props }: ComponentRenderProps<ListProps>) {
  return (
    <List
      variant={props.variant ?? "number"}
      heading={props.heading}
      description={props.description}
      items={(props.items ?? []).map(({ props: item }) => ({
        title: item.title,
        subtitle: item.subtitle,
        icon: item.icon?.props,
      }))}
    />
  );
}

export const ListComponent = defineComponent({
  name: "List",
  props: listPropsSchema,
  description: "",
  component: ListRenderer,
});
