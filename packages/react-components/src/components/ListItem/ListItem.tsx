"use client";

import clsx from "clsx";
import React, { CSSProperties, ReactNode } from "react";
import { listItemStyles, names } from "./listItem.styles";

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

  const styles = listItemStyles;
  const hasAction = !!onClick;

  return (
    <div
      ref={ref}
      className={clsx(
        styles.root,
        names.root,
        styles.size[size],
        names.size[size],
        names.variant[variant],
        listHasSubtitle && styles.listHasSubtitle,
        listHasSubtitle && names.listHasSubtitle,
        className,
      )}
      data-action={hasAction || undefined}
      style={style}
      {...rest}
    >
      <div
        className={clsx(styles.item, names.item)}
        data-action={hasAction || undefined}
        data-subtitle={!!subtitle || undefined}
        onClick={onClick}
        role={hasAction ? "button" : undefined}
        tabIndex={hasAction ? 0 : undefined}
      >
        <div className={clsx(styles.indicator, names.indicator)}>
          {variant === "number" && (
            <div className={clsx(styles.indicatorNumber, names.indicatorNumber)}>{index + 1}</div>
          )}
          {variant === "icon" && icon}
          {variant === "image" && image && (image.src || image.alt) && (
            <div className={clsx(styles.indicatorImage, names.indicatorImage)}>
              <img
                className={clsx(styles.image, names.image)}
                src={image.src}
                alt={image.alt}
                width={40}
                height={40}
              />
            </div>
          )}
        </div>
        <div className={clsx(styles.contentWrapper, names.contentWrapper)}>
          <div className={clsx(styles.content, names.content)}>
            {title && <div className={clsx(styles.title, names.title)}>{title}</div>}
            {subtitle && <div className={clsx(styles.subtitle, names.subtitle)}>{subtitle}</div>}
          </div>
          {hasAction && (actionIcon || actionLabel) && (
            <div className={clsx(styles.action, names.action)}>
              {actionLabel && (
                <div className={clsx(styles.actionLabel, names.actionLabel)}>{actionLabel}</div>
              )}
              {actionIcon && (
                <div className={clsx(styles.actionIcon, names.actionIcon)}>{actionIcon}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ListItem.displayName = "ListItem";

export { ListItem };
