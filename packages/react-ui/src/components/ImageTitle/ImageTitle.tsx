import clsx from "clsx";
import { forwardRef, type ReactNode } from "react";

export interface ImageTitleProps {
  /** The image on top, usually an Image. */
  image?: ReactNode;
  /** What sits under the image: a title Text, an EntityTitle, an author line, a price. */
  children?: ReactNode;
  className?: string;
}

/** An image with a composable slot under it. */
export const ImageTitle = forwardRef<HTMLDivElement, ImageTitleProps>(
  ({ image, children, className }, ref) => (
    <div ref={ref} className={clsx("openui-image-title", className)}>
      {image && <div className="openui-image-title__image">{image}</div>}
      {children && <div className="openui-image-title__content">{children}</div>}
    </div>
  ),
);

ImageTitle.displayName = "ImageTitle";
