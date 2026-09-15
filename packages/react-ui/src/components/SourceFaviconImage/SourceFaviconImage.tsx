import { memo, useEffect, useRef, useState } from "react";
import { IconWrapper } from "../_shared/icons";

export interface SourceFaviconImageProps {
  height: number;
  width: number;
  url: string;
  alt: string;
}

/**
 * Favicon image with a globe-icon fallback. Google's favicon service returns a
 * 16x16 placeholder when it has nothing better, which is treated as a miss.
 */
export const SourceFaviconImage = memo(({ height, width, url, alt }: SourceFaviconImageProps) => {
  const ref = useRef<HTMLImageElement>(null);
  const [imageError, setImageError] = useState(false);

  // A new url gets a fresh chance to load; without this the previous url's
  // failure would keep the globe fallback pinned.
  useEffect(() => {
    setImageError(false);
  }, [url]);

  const onSuccess = () => {
    const img = ref.current;
    // Google's default favicon is 16x16. If we get that, it's likely a fallback.
    if (img && img.naturalWidth <= 16 && img.naturalHeight <= 16) {
      setImageError(true);
    } else {
      setImageError(false);
    }
  };

  const onError = () => {
    setImageError(true);
  };

  if (imageError || !url) {
    return <IconWrapper name="globe" size={Math.max(height, width)} />;
  }

  return (
    <img
      ref={ref}
      src={url}
      alt={alt}
      height={height}
      width={width}
      onLoad={onSuccess}
      onError={onError}
      className="openui-source-favicon-image"
    />
  );
});

SourceFaviconImage.displayName = "SourceFaviconImage";
