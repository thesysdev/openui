"use client";

import { defineComponent, type ElementNode } from "@openuidev/react-lang";
import { inline } from "../markdownBlocks";
import { cx, isElement, str } from "../style";
import { createListSchema, ListItemSchema } from "./schema";

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

const isItem = (value: unknown): value is ElementNode => isElement(value) && value.typeName === "ListItem";

/**
 * A text list: bullets, numbers or no marker; a per-item marker (a time, an
 * emoji, a step letter) from ListItem; and a timeline that joins the markers.
 * It stays the kit's own: react-components' ListBlock is a list of rows (an
 * icon or thumbnail, a divider, a click), with none of these.
 */
export const List = defineComponent({
  name: "List",
  props: createListSchema(ListItem),
  description: "timeline joins the markers with a line.",
  component: ({ props, renderNode }) => {
    const items = (Array.isArray(props.items) ? props.items.flat() : []) as unknown[];
    const marker = props.marker ?? "bullet";
    const textMarkers = items.some((item) => isItem(item) && typeof item.props.marker === "string" && item.props.marker.length > 2);
    const Tag = marker === "number" ? "ol" : "ul";
    return (
      <Tag className={cx("iui-list", `iui-list-${marker}`, props.timeline && "iui-timeline", textMarkers && "iui-list-wide")}>
        {items.map((item, i) => {
          if (item == null) return null;
          const custom = isItem(item) && typeof item.props.marker === "string" && item.props.marker ? item.props.marker : null;
          const step = !!custom && /^[0-9A-Za-z]{1,2}$/.test(custom);
          const rich = isItem(item) && (!!item.props.description || !!item.props.children);
          return (
            <li key={i} className={cx(rich && "iui-list-rich")}>
              <span className={cx("iui-list-marker", custom && (step ? "iui-list-marker-chip" : "iui-list-marker-text"))} aria-hidden={!custom}>
                {step ? <span>{custom}</span> : custom ?? (marker === "number" ? i + 1 : null)}
              </span>
              {isItem(item) ? renderNode(item) : <div className="iui-list-body">{inline(str(item))}</div>}
            </li>
          );
        })}
      </Tag>
    );
  },
});
