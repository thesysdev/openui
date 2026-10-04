import clsx from "clsx";
import { forwardRef } from "react";
import { IconWrapper, type IconProps } from "../_shared/icons";

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
    if (!icon?.name) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={clsx(
          "openui-icon-tag",
          `openui-icon-tag--${size}`,
          `openui-icon-tag--${variant}`,
          className,
        )}
      >
        <IconWrapper name={icon.name} category={icon.category} />
      </div>
    );
  },
);

IconTag.displayName = "IconTag";
