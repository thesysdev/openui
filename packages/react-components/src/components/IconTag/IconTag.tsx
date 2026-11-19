"use client";

import clsx from "clsx";
import { forwardRef } from "react";
import { IconWrapper, type IconProps } from "../_shared/icons";
import { iconTagStyles, names } from "./iconTag.styles";

export type IconTagSize = "xs" | "s" | "m" | "l" | "xl";
export type IconTagVariant = "neutral" | "info" | "success" | "warning" | "danger" | "inverted";

export interface IconTagProps {
  icon: IconProps;
  size?: IconTagSize;
  variant?: IconTagVariant;
  className?: string;
}

/** Small icon badge used inside card primitives. */
export const IconTag = forwardRef<HTMLDivElement, IconTagProps>(
  ({ icon, size = "m", variant = "neutral", className }, ref) => {
    const styles = iconTagStyles;
    if (!icon?.name) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={clsx(
          styles.root,
          names.root,
          styles.size[size],
          names.size[size],
          styles.variant[variant],
          names.variant[variant],
          className,
        )}
      >
        <IconWrapper
          className={clsx(styles.icon, names.icon)}
          name={icon.name}
          category={icon.category}
        />
      </div>
    );
  },
);

IconTag.displayName = "IconTag";
