"use client";

import clsx from "clsx";
import { forwardRef } from "react";
import { TextBlockView } from "../TextBlock";
import { imageTextLargeStyles, names } from "./imageTextLarge.styles";

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
    const styles = imageTextLargeStyles;
    const altText = alt ?? title;

    return (
      <div ref={ref} className={clsx(styles.root, names.root, className)}>
        <div className={clsx(styles.imageWrap, names.imageWrap)}>
          <img className={clsx(styles.image, names.image)} src={src} alt={altText} />
        </div>
        <div className={names.content}>
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
