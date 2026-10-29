"use client";

import { defineComponent } from "@openuidev/react-lang";
import { inline } from "../markdownBlocks";
import { str } from "../style";
import { ListItemSchema } from "./schema";

export * from "./schema";

export const ListItem = defineComponent({
  name: "ListItem",
  props: ListItemSchema,
  description: "marker replaces the bullet or number, e.g. a time or an emoji.",
  // Rendered by List; on its own it shows its content.
  component: ({ props, renderNode }) => (
    <div className="iui-list-body">
      <div className="iui-list-title">{inline(str(props.title))}</div>
      {props.description ? <div className="iui-list-description">{inline(str(props.description))}</div> : null}
      {props.children ? <div className="iui-list-children">{renderNode(props.children)}</div> : null}
    </div>
  ),
});
