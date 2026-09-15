import clsx from "clsx";
import { forwardRef } from "react";
import { IconTag, type IconTagVariant } from "../IconTag";
import { TextBlockView } from "../TextBlock";
import type { IconProps } from "../_shared/icons";

export type IconTextIconVariant = IconTagVariant | "filled" | "soft";
export type IconTextLayout = "horizontal" | "vertical";

export interface IconTextProps {
  icon: IconProps;
  title: string;
  subtitle?: string;
  iconVariant?: IconTextIconVariant;
  bold?: boolean;
  layout?: IconTextLayout;
  className?: string;
}

function normalizeIconVariant(variant: IconTextIconVariant): IconTagVariant {
  switch (variant) {
    case "filled":
    case "soft":
      return "neutral";
    default:
      return variant;
  }
}

/** An icon badge beside (or above) a title with an optional subtitle. */
export const IconText = forwardRef<HTMLDivElement, IconTextProps>(
  (
    {
      icon,
      title,
      subtitle,
      iconVariant = "neutral",
      bold = false,
      layout = "horizontal",
      className,
    },
    ref,
  ) => (
    <div ref={ref} className={clsx("openui-icon-text", `openui-icon-text--${layout}`, className)}>
      <IconTag icon={icon} variant={normalizeIconVariant(iconVariant)} size="l" />
      <div className="openui-icon-text__content">
        <TextBlockView
          variant={bold ? "highlight-text-number-subtext" : "text-subtext"}
          primary={title}
          secondary={subtitle}
          type="text"
          size={layout === "horizontal" ? "xs" : "sm"}
          align="left"
        />
      </div>
    </div>
  ),
);

IconText.displayName = "IconText";
