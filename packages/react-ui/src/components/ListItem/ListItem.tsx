import clsx from "clsx";
import React, { CSSProperties, ReactNode } from "react";

export type ListItemVariant = "icon" | "image" | "number";
export type ListItemSize = "default" | "small";

export interface ListItemProps {
  className?: string;
  style?: CSSProperties;
  title?: ReactNode;
  subtitle?: ReactNode;
  variant?: ListItemVariant;
  size?: ListItemSize;
  icon?: ReactNode;
  image?: { src?: string; alt: string };
  index?: number;
  listHasSubtitle?: boolean;
  actionLabel?: ReactNode;
  actionIcon?: ReactNode;
  onClick?: () => void;
}

const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>((props, ref) => {
  const {
    className,
    style,
    variant = "number",
    size = "default",
    icon,
    image,
    index = 0,
    listHasSubtitle,
    title,
    subtitle,
    actionIcon,
    actionLabel,
    onClick,
    ...rest
  } = props;

  const hasAction = !!onClick;

  return (
    <div
      ref={ref}
      className={clsx(
        "openui-list-item-wrapper",
        size === "small" && "openui-list-item-wrapper--small",
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
        <div
          className={clsx(
            "openui-list-item-indicator",
            !listHasSubtitle && "openui-list-item-indicator-no-subtitle",
            hasAction && "openui-list-item-indicator-clickable",
          )}
        >
          {variant === "number" && (
            <div className="openui-list-item-indicator-number">{index + 1}</div>
          )}
          {variant === "icon" && icon}
          {variant === "image" && image && (image.src || image.alt) && (
            <div className="openui-list-item-indicator-image">
              <img src={image.src} alt={image.alt} width={40} height={40} />
            </div>
          )}
        </div>
        <div className="openui-list-item-content-wrapper">
          <div className="openui-list-item-content">
            {title && <div className="openui-list-item-title">{title}</div>}
            {subtitle && <div className="openui-list-item-subtitle">{subtitle}</div>}
          </div>
          {hasAction && (actionIcon || actionLabel) && (
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
