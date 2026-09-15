import clsx from "clsx";
import { forwardRef } from "react";
import { TextBlockView } from "../TextBlock";

export interface ImageTextLargeProps {
  title: string;
  subtitle?: string;
  src: string;
  alt?: string;
  className?: string;
}

/** A full-width banner image above a bold title with an optional subtitle. */
export const ImageTextLarge = forwardRef<HTMLDivElement, ImageTextLargeProps>(
  ({ title, subtitle, src, alt, className }, ref) => {
    const altText = alt ?? title;

    return (
      <div ref={ref} className={clsx("openui-image-text-large", className)}>
        <div className="openui-image-text-large__image-wrap">
          <img className="openui-image-text-large__image" src={src} alt={altText} />
        </div>
        <div className="openui-image-text-large__content">
          <TextBlockView
            variant="highlight-text"
            primary={title}
            secondary={subtitle}
            type="text"
            size="sm"
            align="left"
          />
        </div>
      </div>
    );
  },
);

ImageTextLarge.displayName = "ImageTextLarge";
