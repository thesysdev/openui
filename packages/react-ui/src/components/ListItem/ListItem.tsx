import clsx from "clsx";
import React, { CSSProperties, ReactNode } from "react";

/** number shows a small accent number inline with the title; plain shows none. */
export type ListItemVariant = "number" | "plain";

export interface ListItemProps {
  className?: string;
  style?: CSSProperties;
  /** A string, or composed content such as Text, a Link or a Tag. */
  title?: ReactNode;
  /** A string, or composed content such as a Metric, Tag or LeadingText. */
  subtitle?: ReactNode;
  variant?: ListItemVariant;
  /** A visual before the text, usually an Avatar (photo, logo or icon badge). */
  leading?: ReactNode;
  index?: number;
  listHasSubtitle?: boolean;
  actionLabel?: ReactNode;
  actionIcon?: ReactNode;
  /** Controls on the right (a Button, Buttons or IconButton), in place of the chevron. */
  actionSlot?: ReactNode;
  onClick?: () => void;
}

const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>((props, ref) => {
  const {
    className,
    style,
    variant = "number",
    leading,
    index = 0,
    listHasSubtitle,
    title,
    subtitle,
    actionIcon,
    actionLabel,
    actionSlot,
    onClick,
    ...rest
  } = props;

  const hasAction = !!onClick;
  const composed = (value: ReactNode) => value != null && typeof value !== "string";

  return (
    <div
      ref={ref}
      className={clsx(
        "openui-list-item-wrapper",
        hasAction && "openui-list-item-wrapper-with-action",
        className,
      )}
      style={style}
      {...rest}
    >
      <div
        className={clsx("openui-list-item", hasAction && "openui-list-item-clickable")}
        onClick={onClick}
        role={hasAction ? "button" : undefined}
        tabIndex={hasAction ? 0 : undefined}
      >
        {leading && (
          <div
            className={clsx(
              "openui-list-item-leading",
              !listHasSubtitle && "openui-list-item-leading-no-subtitle",
            )}
          >
            {leading}
          </div>
        )}
        {/* A leading visual already marks the row, so the number only shows without one. */}
        {variant === "number" && !leading && (
          <span className="openui-list-item-number">{index + 1}</span>
        )}
        <div className="openui-list-item-content-wrapper">
          <div className="openui-list-item-content">
            {title && (
              <div
                className={clsx(
                  "openui-list-item-title",
                  composed(title) && "openui-list-item-title--composed",
                )}
              >
                {title}
              </div>
            )}
            {subtitle && (
              <div
                className={clsx(
                  "openui-list-item-subtitle",
                  composed(subtitle) && "openui-list-item-subtitle--composed",
                )}
              >
                {subtitle}
              </div>
            )}
          </div>
          {actionSlot && <div className="openui-list-item-action-slot">{actionSlot}</div>}
          {!actionSlot && hasAction && (actionIcon || actionLabel) && (
            <div className="openui-list-item-action">
              {actionLabel && <div className="openui-list-item-action-label">{actionLabel}</div>}
              {actionIcon && <div className="openui-list-item-action-icon">{actionIcon}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ListItem.displayName = "ListItem";

export { ListItem };
