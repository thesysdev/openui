"use client";

import clsx from "clsx";
import React, { forwardRef, useRef, useState } from "react";
import { useResponsiveContainer } from "../../hooks/useResponsiveContainer";
import { imageBlockStyles, names } from "./imageBlock.styles";

export interface ImageBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  alt?: string;
  imageLoading?: boolean;
}

export const ImageBlock = forwardRef<HTMLDivElement, ImageBlockProps>(
  ({ src, alt, className, imageLoading, ...rest }, ref) => {
    const styles = imageBlockStyles;
    const [isImageLoading, setIsImageLoading] = useState<boolean>(imageLoading ?? true);
    const [hasError, setHasError] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { breakpoint } = useResponsiveContainer(containerRef);
    const isMobile = breakpoint === "mobile";

    if (!src) return null;

    return (
      <div
        ref={(node) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={clsx(styles.root, names.root, className)}
        data-breakpoint={isMobile ? "mobile" : breakpoint}
        data-error={hasError || undefined}
        data-loading={isImageLoading || undefined}
        style={
          src && !hasError
            ? ({ "--_openui-image-block-background": `url(${src})` } as React.CSSProperties)
            : undefined
        }
        {...rest}
      >
        <img
          src={src}
          alt={alt}
          className={clsx(styles.image, names.image)}
          data-breakpoint={isMobile ? "mobile" : breakpoint}
          data-error={hasError || undefined}
          onLoad={() => {
            setIsImageLoading(false);
            setHasError(false);
          }}
          onError={() => {
            setIsImageLoading(false);
            setHasError(true);
          }}
        />
        {isImageLoading && <div className={clsx(styles.loader, names.loader)} />}
      </div>
    );
  },
);

ImageBlock.displayName = "ImageBlock";
