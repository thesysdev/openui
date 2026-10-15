import * as AspectRatio from "@radix-ui/react-aspect-ratio";
import clsx from "clsx";
import React, { forwardRef, useCallback, useState } from "react";

type AspectRatioType = "auto" | "1:1" | "3:2" | "3:4" | "4:3" | "16:9" | "9:16";
type ScaleType = "fit" | "fill";

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Empty or missing keeps the loading frame and renders no <img>. */
  src?: string;
  alt?: string;
  styles?: React.CSSProperties;
  className?: string;
  aspectRatio?: AspectRatioType;
  scale?: ScaleType;
}

const aspectRatioMap: Record<Exclude<AspectRatioType, "auto">, number> = {
  "1:1": 1,
  "3:2": 3 / 2,
  "3:4": 3 / 4,
  "4:3": 4 / 3,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
};

const scaleMap: Record<ScaleType, string> = {
  fit: "openui-image-fit",
  fill: "openui-image-fill",
};

export const Image = forwardRef<HTMLImageElement, ImageProps>((props, ref) => {
  const { src, alt, styles, className, aspectRatio = "3:2", scale = "fill", ...rest } = props;
  const [hasError, setHasError] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);

  // Forward the ref, and catch images that finished loading before hydration
  // attached onLoad (cached or server-rendered), so the shimmer doesn't stick.
  const setRef = useCallback(
    (node: HTMLImageElement | null) => {
      if (node?.complete && node.naturalWidth > 0) setLoaded(true);
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const imageClasses = clsx(
    "openui-image",
    {
      [`${scaleMap[scale]}`]: scale && aspectRatio !== "auto",
      "openui-image--auto": aspectRatio === "auto",
      "openui-image--error": hasError,
    },
    className,
  );

  // No src yet (still streaming, or the agent sent an empty one): keep the
  // loading frame and render no <img>, since src="" makes the browser
  // re-request the page.
  const image = src ? (
    <img
      ref={setRef}
      src={src}
      alt={alt}
      className={imageClasses}
      style={styles}
      onLoad={() => {
        setHasError(false);
        setLoaded(true);
      }}
      onError={() => {
        setHasError(true);
        setLoaded(true);
      }}
      {...rest}
    />
  ) : null;

  // "auto" keeps the image's own proportions; the others crop it to the frame.
  // The frame clips and rounds the image, so the hover zoom stays inside it.
  const frameClass = clsx(
    "openui-image-frame",
    (!loaded || !src) && "openui-image-frame--loading",
    aspectRatio === "auto" && "openui-image-frame--auto",
  );
  if (aspectRatio === "auto") return <div className={frameClass}>{image}</div>;
  return (
    <AspectRatio.Root ratio={aspectRatioMap[aspectRatio]} className={frameClass}>
      {image}
    </AspectRatio.Root>
  );
});

Image.displayName = "Image";
