"use client";

import clsx from "clsx";
import { forwardRef, useContext } from "react";
import { IconTag, type IconTagVariant } from "../IconTag";
import { TextBlockView, type TextBlockOverflow, type TextBlockWidth } from "../TextBlock";
import { TextFitContext } from "../TextBlock/TextFit";
import type { IconProps } from "../_shared/icons";
import { iconTextStyles, names } from "./iconText.styles";

export type IconTextIconVariant = IconTagVariant | "filled" | "soft";
export type IconTextLayout = "horizontal" | "vertical";

export interface IconTextProps {
  icon: IconProps;
  title: string;
  subtitle?: string;
  iconVariant?: IconTextIconVariant;
  bold?: boolean;
  layout?: IconTextLayout;
  /**
   * `"truncate"` keeps the title and subtitle to one line each, ending in an ellipsis, and lets the
   * component shrink in a flex row. SnippetCardBlock sets it for its slots; pass `"wrap"` there to
   * wrap anyway. Omitted elsewhere, the text wraps.
   */
  overflow?: TextBlockOverflow;
  /** `"fill"` makes the component as wide as its container. Omit it to size to the content. */
  width?: TextBlockWidth;
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
      overflow: ownOverflow,
      width: ownWidth,
      className,
    },
    ref,
  ) => {
    // A card slot supplies the fit the caller leaves out.
    const slot = useContext(TextFitContext);
    const overflow = ownOverflow ?? slot.overflow ?? "wrap";
    const width = ownWidth ?? slot.width;
    const styles = iconTextStyles;
    return (
      <div
        ref={ref}
        className={clsx(
          styles.root,
          names.root,
          styles.layout[layout],
          names.layout[layout],
          names.iconVariant[iconVariant],
          bold && names.bold.true,
          overflow && [styles.overflow[overflow], names.overflow[overflow]],
          width && [styles.width[width], names.width[width]],
          className,
        )}
      >
        <IconTag
          icon={icon}
          variant={normalizeIconVariant(iconVariant)}
          size="l"
          className={clsx(styles.icon, names.icon)}
        />
        <div className={clsx(styles.content, names.content)}>
          <TextBlockView
            variant={bold ? "highlight-text-number-subtext" : "text-subtext"}
            primary={title}
            secondary={subtitle}
            type="text"
            size={layout === "horizontal" ? "xs" : "sm"}
            overflow={overflow}
            width={width}
          />
        </div>
      </div>
    );
  },
);

IconText.displayName = "IconText";
