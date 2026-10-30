import { isValidElement, type ReactElement, type ReactNode } from "react";
import { cx } from "../../shared/style";

export interface ListItemProps {
  title: ReactNode;
  description?: ReactNode;
  /** Replaces the bullet or number, e.g. a time, an emoji or a step letter. */
  marker?: string | null;
  /** Nested content under the item. */
  children?: ReactNode;
}

/** A list entry with a title, an optional description and nested content. In a List, its marker replaces the bullet. */
function ListItem({ title, description, children }: ListItemProps) {
  return (
    <div className="openui-intelligent-list-body">
      <div className="openui-intelligent-list-title">{title}</div>
      {description != null ? <div className="openui-intelligent-list-description">{description}</div> : null}
      {children !== undefined ? <div className="openui-intelligent-list-children">{children}</div> : null}
    </div>
  );
}

const isListItem = (item: ReactNode): item is ReactElement<ListItemProps> => isValidElement(item) && item.type === ListItem;

export interface ListProps {
  /** Each entry is plain content or a ListItem. */
  items: ReactNode[];
  marker?: "bullet" | "number" | "none";
  /** Joins the markers with a line. */
  timeline?: boolean;
}

function List({ items, marker: markerProp, timeline }: ListProps) {
  const marker = markerProp ?? "bullet";
  const textMarkers = items.some((item) => isListItem(item) && typeof item.props.marker === "string" && item.props.marker.length > 2);
  const Tag = marker === "number" ? "ol" : "ul";
  return (
    <Tag className={cx("openui-intelligent-list", `openui-intelligent-list-${marker}`, timeline && "openui-intelligent-timeline", textMarkers && "openui-intelligent-list-wide")}>
      {items.map((item, i) => {
        if (item == null) return null;
        const custom = isListItem(item) && typeof item.props.marker === "string" && item.props.marker ? item.props.marker : null;
        const step = !!custom && /^[0-9A-Za-z]{1,2}$/.test(custom);
        const rich = isListItem(item) && (item.props.description != null || item.props.children !== undefined);
        return (
          <li key={i} className={cx(rich && "openui-intelligent-list-rich")}>
            <span className={cx("openui-intelligent-list-marker", custom && (step ? "openui-intelligent-list-marker-chip" : "openui-intelligent-list-marker-text"))} aria-hidden={!custom}>
              {step ? <span>{custom}</span> : custom ?? (marker === "number" ? i + 1 : null)}
            </span>
            {isListItem(item) ? item : <div className="openui-intelligent-list-body">{item}</div>}
          </li>
        );
      })}
    </Tag>
  );
}

export { List, ListItem };
