import clsx from "clsx";
import React, { forwardRef, useRef, useState } from "react";
import { useResponsiveContainer } from "../../hooks/useResponsiveContainer";
import { toCssUrl } from "../_shared/utils";

export interface ImageBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  alt?: string;
  imageLoading?: boolean;
}

export const ImageBlock = forwardRef<HTMLDivElement, ImageBlockProps>(
  ({ src, alt, className, imageLoading, ...rest }, ref) => {
    const [isImageLoading, setIsImageLoading] = useState<boolean>(imageLoading ?? true);
    const [hasError, setHasError] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { breakpoint } = useResponsiveContainer(containerRef);
    const isMobile = breakpoint === "mobile";

    if (!src) return null;
    const bgImage = hasError ? undefined : toCssUrl(src);

    return (
      <div
        ref={(node) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={clsx(
          "openui-image-block-wrapper",
          {
            "openui-image-block-wrapper--mobile": isMobile,
            "openui-image-block-wrapper--error": hasError,
          },
          className,
        )}
        style={bgImage ? ({ "--bg-image": bgImage } as React.CSSProperties) : undefined}
        {...rest}
      >
        <img
          src={src}
          alt={alt}
          className={clsx("openui-image-block-image", {
            "openui-image-block-image--mobile": isMobile,
            "openui-image-block-image--error": hasError,
          })}
          onLoad={() => {
            setIsImageLoading(false);
            setHasError(false);
          }}
          onError={() => {
            setIsImageLoading(false);
            setHasError(true);
          }}
        />
        {isImageLoading && <div className="openui-image-block-loader" />}
      </div>
    );
  },
);

ImageBlock.displayName = "ImageBlock";
