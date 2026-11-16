"use client";

/**
 * The library's own photo, which Image draws with. It stays the library's rather than
 * react-components' Image, which is a plain <img> in a preset-ratio box: the work here is
 * the loading shimmer, the empty state when the URL fails, and free aspect ratios.
 */

import clsx from "clsx";
import { ImageIcon } from "lucide-react";
import { useState } from "react";
import { radius, type Radius } from "../../shared/props";
import { webUrl } from "../../shared/url";
import { names, photoStyles } from "./photo.styles";

export interface PhotoProps {
  /** What the photo shows, for screen readers. */
  alt: string;
  /** An http(s) URL. */
  src?: string | null;
  /** Width over height, 0.2 to 5 (default 1.5). */
  aspectRatio?: number | null;
  /** A radius token or px (default "lg"). */
  radius?: Radius | null;
  /** cover (the default) crops to the box; contain shows the whole photo. */
  fit?: "cover" | "contain" | null;
}

/** A photo from src, or an empty photo placeholder when there is no src or it fails. */
export function Photo(props: PhotoProps) {
  const alt = typeof props.alt === "string" ? props.alt.trim() : "";
  const src = webUrl(props.src);
  const [failed, setFailed] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<string | null>(null);
  const current = src && src !== failed ? src : null;
  const settled = !current;
  const ratio =
    typeof props.aspectRatio === "number" && props.aspectRatio > 0.2 && props.aspectRatio < 5
      ? props.aspectRatio
      : 1.5;
  return (
    <div
      className={clsx(
        photoStyles.root,
        names.root,
        props.fit === "contain" && [photoStyles.contain, names.contain],
      )}
      data-state={loaded === current ? "loaded" : settled ? "empty" : undefined}
      style={{ aspectRatio: ratio, borderRadius: radius(props.radius ?? "lg") }}
      role={current ? undefined : "img"}
      aria-label={current ? undefined : alt}
    >
      {current ? (
        <img
          key={current}
          className={clsx(photoStyles.image, names.image)}
          src={current}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(current)}
          onError={() => setFailed(current)}
        />
      ) : settled ? (
        <ImageIcon aria-hidden className={clsx(photoStyles.empty, names.empty)} strokeWidth={1.5} />
      ) : null}
    </div>
  );
}
