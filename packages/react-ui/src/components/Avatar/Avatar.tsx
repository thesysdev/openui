import clsx from "clsx";
import { ImageOff } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getFaviconUrl } from "../Sources/SourceContext";

export type AvatarShape = "circle" | "rounded";
export type AvatarSize = "inline" | "md" | "lg";
export type AvatarColor =
  "neutral" | "info" | "success" | "warning" | "danger" | "purple" | "pink" | "inverted";

export interface AvatarProps {
  /** Person or company name, used as the accessible label. */
  name: string;
  /** Image URL (a photo or logo). */
  src?: string;
  /** A company's website; its favicon is used when there's no src. */
  domain?: string;
  /** circle for people (default), rounded for logos. */
  shape?: AvatarShape;
  /** inline (default) sits on a text line like an Icon; md 32px; lg 48px. */
  size?: AvatarSize;
  /** An icon shown inside the shape when there's no image. */
  icon?: ReactNode;
  /** Background tint behind the icon; the icon color matches it. */
  color?: AvatarColor;
  className?: string;
}

const faviconFor = (domain?: string) => {
  if (!domain) return "";
  const url = /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
  return getFaviconUrl(url, 128);
};

/**
 * A small photo or logo that can stand in for an Icon, or an Icon on a tinted
 * shape. A broken image shows the icon if given, else a placeholder icon.
 */
export const Avatar = ({
  name,
  src,
  domain,
  shape = "circle",
  size = "inline",
  icon,
  color = "neutral",
  className,
}: AvatarProps) => {
  const imageUrl = src || faviconFor(domain);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  // An image can fail before hydration attaches onError, so also check once
  // on mount whether it already finished loading with no pixels.
  useEffect(() => {
    const img = imgRef.current;
    setFailed(Boolean(img && img.complete && img.naturalWidth === 0));
  }, [imageUrl]);
  const showImage = Boolean(imageUrl) && !failed;
  // A broken image becomes a placeholder icon; with no image and no icon at
  // all there's nothing to show.
  const content = icon ?? (imageUrl ? <ImageOff /> : null);
  if (!showImage && !content) return null;

  return (
    <span
      className={clsx(
        "openui-avatar",
        `openui-avatar--${shape}`,
        `openui-avatar--${size}`,
        `openui-avatar--color-${color}`,
        className,
      )}
      role="img"
      aria-label={name}
      title={name}
    >
      {showImage ? (
        <img
          ref={imgRef}
          className="openui-avatar__image"
          src={imageUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="openui-avatar__icon" aria-hidden>
          {content}
        </span>
      )}
    </span>
  );
};
