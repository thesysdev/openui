import * as AspectRatio from "@radix-ui/react-aspect-ratio";
import clsx from "clsx";
import React, { forwardRef, useState } from "react";

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

const aspectRatioMap: Record<AspectRatioType, number> = {
  "1:1": 1,
  "3:2": 3 / 2,
  "3:4": 3 / 4,
  "4:3": 4 / 3,
  "16:9": 16 / 9,
};

const scaleMap: Record<ScaleType, string> = {
  fit: "openui-image-fit",
  fill: "openui-image-fill",
};

export const Image = forwardRef<HTMLImageElement, ImageProps>((props, ref) => {
  const { src, alt, styles, className, aspectRatio = "3:2", scale = "fill", ...rest } = props;
  const [hasError, setHasError] = useState<boolean>(false);

  const imageClasses = clsx(
    "openui-image",
    {
      [`${scaleMap[scale]}`]: scale,
      "openui-image--error": hasError,
    },
    className,
  );

  const image = (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={imageClasses}
      style={styles}
      onLoad={() => setHasError(false)}
      onError={() => setHasError(true)}
      {...rest}
    />
  );

  return <AspectRatio.Root ratio={aspectRatioMap[aspectRatio]}>{image}</AspectRatio.Root>;
});

Image.displayName = "Image";
