"use client";

import clsx from "clsx";
import {
  Children,
  cloneElement,
  CSSProperties,
  forwardRef,
  isValidElement,
  ReactElement,
} from "react";
import { ListItemProps, ListItemSize, ListItemVariant } from "../ListItem";
import { listBlockStyles, names } from "./listBlock.styles";

export interface ListBlockProps {
  /** Controls the indicator shown on every ListItem. Defaults to "number". */
  variant?: ListItemVariant;
  /** "small" tightens spacing and typography (used inside cards). Defaults to "default". */
  size?: ListItemSize;
  children: ReactElement<ListItemProps> | ReactElement<ListItemProps>[];
  className?: string;
  style?: CSSProperties;
}

const ListBlock = forwardRef<HTMLDivElement, ListBlockProps>((props, ref) => {
  const { children, variant = "number", size = "default", className, style } = props;

  const styles = listBlockStyles;
  const childArray = Children.toArray(children);
  const listHasSubtitle = childArray.some(
    (child) => isValidElement(child) && !!(child as ReactElement<ListItemProps>).props.subtitle,
  );

  const enhancedChildren = Children.map(children, (child, index) => {
    if (isValidElement(child)) {
      return cloneElement(child as ReactElement<ListItemProps>, {
        variant,
        size,
        listHasSubtitle,
        index,
      });
    }
    return child;
  });

  return (
    <div
      ref={ref}
      className={clsx(
        styles.root,
        names.root,
        styles.size[size],
        names.size[size],
        names.variant[variant],
        className,
      )}
      style={style}
    >
      {enhancedChildren}
    </div>
  );
});

ListBlock.displayName = "ListBlock";

export { ListBlock };
