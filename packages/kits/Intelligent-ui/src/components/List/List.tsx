import clsx from "clsx";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { names, styles } from "./list.styles";

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
    <div className={names.body}>
      <div className={clsx(styles.title, names.title)}>{title}</div>
      {description != null ? <div className={clsx(styles.description, names.description)}>{description}</div> : null}
      {children !== undefined ? <div className={clsx(styles.children, names.children)}>{children}</div> : null}
    </div>
  );
}

const isListItem = (item: ReactNode): item is ReactElement<ListItemProps> => isValidElement(item) && item.type === ListItem;

const customMarker = (item: ReactNode) => (isListItem(item) && typeof item.props.marker === "string" && item.props.marker ? item.props.marker : null);

const isStep = (marker: string | null) => !!marker && /^[0-9A-Za-z]{1,2}$/.test(marker);

export interface ListProps {
  /** Each entry is plain content or a ListItem. */
  items: ReactNode[];
  marker?: "bullet" | "number" | "none";
  /** Joins the markers with a line. */
  timeline?: boolean;
}

/**
 * A text list: bullets, numbers or no marker; a per-item marker (a time, an
 * emoji, a step letter) from ListItem; and a timeline that joins the markers.
 * It stays the kit's own: react-components' ListBlock is a list of rows (an
 * icon or thumbnail, a divider, a click), with none of these.
 */
function List({ items, marker: markerProp, timeline }: ListProps) {
  const marker = markerProp ?? "bullet";
  const wide = items.some((item) => isListItem(item) && typeof item.props.marker === "string" && item.props.marker.length > 2);
  const chips = items.some((item) => isStep(customMarker(item)));
  const layout = wide ? (timeline ? "wideTimeline" : "wide") : chips ? "lane" : marker === "none" ? "stack" : marker === "bullet" && !timeline ? "dots" : "lane";
  const line = timeline && (marker !== "none" || wide);
  const Tag = marker === "number" ? "ol" : "ul";
  return (
    <Tag
      className={clsx(
        styles.root,
        names.root,
        names.marker[marker],
        styles.layout[layout],
        styles.spacing[timeline ? "timeline" : "plain"],
        timeline && names.timeline,
        wide && names.wide,
      )}
    >
      {items.map((item, i) => {
        if (item == null) return null;
        const custom = customMarker(item);
        const step = isStep(custom);
        const rich = isListItem(item) && (item.props.description != null || item.props.children !== undefined);
        return (
          <li
            key={i}
            className={clsx(
              styles.row,
              names.row,
              rich && [styles.rich, names.rich],
              rich && !timeline && styles.richSpacing,
              timeline && styles.timelineRow,
              line && styles.line,
            )}
          >
            <span
              className={clsx(
                styles.markerCell,
                names.markerCell,
                !custom && marker === "none" && [styles.markerKind.hidden, names.markerKind.hidden],
                !custom && marker === "bullet" && [styles.markerKind.dot, names.markerKind.dot],
                marker === "number" && (!custom || step) && [styles.markerKind.number, names.markerKind.number],
                step && names.markerKind.chip,
                custom && !step && [styles.markerKind.text, names.markerKind.text, timeline && wide && styles.timeDot],
              )}
              aria-hidden={!custom}
            >
              {step ? <span className={clsx(styles.chip, names.chip)}>{custom}</span> : custom ?? (marker === "number" ? i + 1 : null)}
            </span>
            {isListItem(item) ? item : <div className={names.body}>{item}</div>}
          </li>
        );
      })}
    </Tag>
  );
}

export { List, ListItem };
