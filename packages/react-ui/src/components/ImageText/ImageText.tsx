import clsx from "clsx";
import { forwardRef } from "react";
import { TextBlockView } from "../TextBlock";

export type ImageTextLayout = "horizontal" | "vertical";

export interface ImageTextProps {
  title: string;
  subtitle?: string;
  src: string;
  alt?: string;
  bold?: boolean;
  layout?: ImageTextLayout;
  /** Square image size in px. Defaults to 40 for horizontal layout. */
  imageSize?: number;
  className?: string;
}

/** A small square image beside (or above) a title with an optional subtitle. */
export const ImageText = forwardRef<HTMLDivElement, ImageTextProps>(
  (
    { title, subtitle, src, alt, bold = false, layout = "horizontal", imageSize, className },
    ref,
  ) => {
    const altText = alt ?? title;
    const size = imageSize ?? (layout === "horizontal" ? 40 : undefined);

    return (
      <div
        ref={ref}
        className={clsx("openui-image-text", `openui-image-text--${layout}`, className)}
      >
        <div
          className="openui-image-text__image-container"
          style={size ? { width: size, height: size } : undefined}
        >
          <img className="openui-image-text__image" src={src} alt={altText} />
        </div>
        <div className="openui-image-text__content">
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
    );
  },
);

ImageText.displayName = "ImageText";
