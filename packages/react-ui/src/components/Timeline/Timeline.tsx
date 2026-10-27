import clsx from "clsx";
import { CSSProperties, ReactNode, useId } from "react";
import { SelectionCheck } from "../OptionCards/SelectionCheck";

/**
 * done is a filled dot, current a filled dot with a halo, upcoming a hollow
 * dot with a quieter title. Without a status the dot is hollow.
 */
export type TimelineItemStatus = "done" | "current" | "upcoming";

export interface TimelineItemData {
  /** A string, or composed content such as Text, a Link or a Tag. */
  title?: ReactNode;
  /** A string, or composed content such as a Metric, Tag or LeadingText. */
  subtitle?: ReactNode;
  /** When the event happens, shown in the column on the left. */
  time?: ReactNode;
  /** A visual in place of the dot, usually an Avatar or icon badge. */
  leading?: ReactNode;
  status?: TimelineItemStatus;
  /** With the check marker: a filled box and a struck-through title. */
  checked?: boolean;
}

/**
 * dot marks each item with a dot; number with ListBlock's numbered chip
 * (Steps); check with a checkbox and no connector (Checklist).
 */
export type TimelineMarker = "dot" | "number" | "check";

export interface TimelineProps {
  items: TimelineItemData[];
  marker?: TimelineMarker;
  /**
   * With the check marker: makes each row a checkbox. Clicking the row, or
   * Space/Enter on its check, calls this with the row's index.
   */
  onToggle?: (index: number) => void;
  /** Blocks toggling, e.g. while the response is still streaming. */
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

const composed = (value: ReactNode) => value != null && typeof value !== "string";

export const Timeline = ({
  items,
  marker = "dot",
  onToggle,
  disabled,
  className,
  style,
}: TimelineProps) => {
  const idBase = useId();
  const toggleable = marker === "check" && !!onToggle;
  const hasTime = items.some((item) => item.time != null);
  const hasLeading = items.some((item) => item.leading != null);

  return (
    <div
      className={clsx(
        "openui-timeline",
        marker === "number" && "openui-timeline--number",
        marker === "check" && "openui-timeline--check",
        hasTime && "openui-timeline--with-time",
        hasLeading && "openui-timeline--with-leading",
        className,
      )}
      style={style}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className={clsx(
            "openui-timeline__item",
            item.status && `openui-timeline__item--${item.status}`,
            marker === "check" && item.checked && "openui-timeline__item--checked",
            toggleable && "openui-timeline__item--toggleable",
            toggleable && disabled && "openui-timeline__item--disabled",
          )}
          onClick={toggleable && !disabled ? () => onToggle(index) : undefined}
        >
          {hasTime && (
            <div
              className={clsx(
                "openui-timeline__time",
                composed(item.time) && "openui-timeline__time--composed",
              )}
            >
              {item.time}
            </div>
          )}
          <div
            className="openui-timeline__rail"
            aria-hidden={!item.leading && !toggleable ? true : undefined}
          >
            <div className="openui-timeline__marker">
              {item.leading ??
                (marker === "number" ? (
                  <span className="openui-list-item-number">{index + 1}</span>
                ) : marker === "check" ? (
                  toggleable ? (
                    // A real button so Space/Enter work; its click bubbles to
                    // the row, which does the toggle.
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={!!item.checked}
                      aria-labelledby={`${idBase}-${index}`}
                      disabled={disabled}
                      className="openui-timeline__check-button"
                    >
                      <SelectionCheck checked={!!item.checked} />
                    </button>
                  ) : (
                    <span role="img" aria-label={item.checked ? "Done" : "Not done"}>
                      <SelectionCheck checked={!!item.checked} />
                    </span>
                  )
                ) : (
                  <span className="openui-timeline__dot" />
                ))}
            </div>
            <div className="openui-timeline__connector" />
          </div>
          <div className="openui-timeline__content">
            {item.title != null && (
              <div
                id={`${idBase}-${index}`}
                className={clsx(
                  "openui-timeline__title",
                  composed(item.title) && "openui-timeline__title--composed",
                )}
              >
                {item.title}
              </div>
            )}
            {item.subtitle != null && (
              <div
                className={clsx(
                  "openui-timeline__subtitle",
                  composed(item.subtitle) && "openui-timeline__subtitle--composed",
                )}
              >
                {item.subtitle}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
