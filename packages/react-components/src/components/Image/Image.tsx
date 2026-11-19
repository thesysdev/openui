"use client";

import clsx from "clsx";
import React, { forwardRef, useState } from "react";
import { imageStyles, names } from "./image.styles";

type AspectRatioType = "1:1" | "3:2" | "3:4" | "4:3" | "16:9";
type ScaleType = "fit" | "fill";

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  styles?: React.CSSProperties;
  className?: string;
  aspectRatio?: AspectRatioType;
  scale?: ScaleType;
}

export const Image = forwardRef<HTMLImageElement, ImageProps>((props, ref) => {
  const { src, alt, styles, className, aspectRatio = "3:2", scale = "fill", ...rest } = props;
  const [hasError, setHasError] = useState<boolean>(false);

  const sheet = imageStyles;
  const imageClasses = clsx(
    sheet.root,
    names.root,
    sheet.scale[scale],
    names.scale[scale],
    className,
  );

  const image = (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={imageClasses}
      data-error={hasError || undefined}
      style={styles}
      onLoad={() => setHasError(false)}
      onError={() => setHasError(true)}
      {...rest}
    />
  );

  return (
    <div
      className={clsx(
        sheet.aspect,
        names.aspect,
        sheet.aspectRatio[aspectRatio],
        names.aspectRatio[aspectRatio],
      )}
      data-radix-aspect-ratio-wrapper=""
    >
      <div className={clsx(sheet.viewport, names.viewport)}>{image}</div>
    </div>
  );
});

Image.displayName = "Image";
