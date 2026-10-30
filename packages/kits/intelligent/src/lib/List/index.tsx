"use client";

import { defineComponent, type ElementNode } from "@openuidev/react-lang";
import { List as ListView, ListItem as ListItemView } from "../../components/List";
import { inline } from "../../components/Markdown/markdownBlocks";
import { str } from "../../shared/style";
import { isElement, type Render } from "../helpers";
import { createListSchema, ListItemSchema } from "./schema";

export * from "./schema";

type ItemProps = { title?: unknown; description?: unknown; marker?: unknown; children?: unknown };

/** A ListItem's evaluated props as the ListItem component's. */
const itemView = (props: ItemProps, renderNode: Render) => (
  <ListItemView
    title={inline(str(props.title))}
    description={props.description ? inline(str(props.description)) : undefined}
    marker={typeof props.marker === "string" ? props.marker : undefined}
  >
    {props.children ? (renderNode(props.children) ?? null) : undefined}
  </ListItemView>
);

export const ListItem = defineComponent({
  name: "ListItem",
  props: ListItemSchema,
  description: "marker replaces the bullet or number, e.g. a time or an emoji.",
  // Rendered by List; on its own it shows its content.
  component: ({ props, renderNode }) => itemView(props, renderNode),
});

const isItem = (value: unknown): value is ElementNode => isElement(value) && value.typeName === "ListItem";

export const List = defineComponent({
  name: "List",
  props: createListSchema(ListItem),
  description: "timeline joins the markers with a line.",
  component: ({ props, renderNode }) => {
    const items = (Array.isArray(props.items) ? props.items.flat() : []) as unknown[];
    return (
      <ListView
        items={items.map((item) => (item == null ? null : isItem(item) ? itemView(item.props, renderNode) : inline(str(item))))}
        marker={props.marker}
        timeline={props.timeline}
      />
    );
  },
});
