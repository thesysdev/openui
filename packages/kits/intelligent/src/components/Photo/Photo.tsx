"use client";

/**
 * The kit's own photo: the Image and SearchImage components draw with it. It stays the kit's
 * rather than react-components' Image, which is a plain <img> in a preset-ratio
 * box: the work here is finding a photo when there is no URL or it fails, the
 * loading shimmer, the empty state and free aspect ratios.
 */

import { ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { endpoints } from "../../shared/config";
import { cx, radius, webUrl, type Radius } from "../../shared/style";

// Image search
const searches = new Map<string, Promise<string[]>>();

async function getJson(url: string): Promise<Record<string, unknown>> {
  const response = await fetch(url);
  return response.ok ? ((await response.json()) as Record<string, unknown>) : {};
}

const urls = (value: unknown) => (Array.isArray(value) ? value.flatMap((u) => (webUrl(u) ? [u as string] : [])) : []);

/**
 * Photo URLs for a query: the Wikipedia article with that exact title first
 * (/api/wiki: right for a named place, dish or product), then a Wikipedia and
 * Commons search (/api/image-search). Failures are retried next time.
 */
function searchImages(query: string): Promise<string[]> {
  let request = searches.get(query);
  if (!request) {
    request = Promise.all([
      getJson(endpoints.wiki(query)).catch((): Record<string, unknown> => ({})),
      getJson(endpoints.imageSearch(query)).catch((): Record<string, unknown> => ({})),
    ]).then(([wiki, found]) => {
      const all = [...urls(wiki.photos), ...urls(found.images)];
      if (!all.length) searches.delete(query);
      return [...new Set(all)];
    });
    if (searches.size > 200) searches.delete(searches.keys().next().value!);
    searches.set(query, request);
  }
  return request;
}

/** Search results for `query`, or undefined while waiting. The query settles first: it may still be streaming. */
function useImageSearch(query: string | null): string[] | undefined {
  const [result, setResult] = useState<{ query: string; images: string[] } | null>(null);
  useEffect(() => {
    if (!query) return;
    let active = true;
    const timer = setTimeout(() => {
      searchImages(query).then((images) => {
        if (active) setResult({ query, images });
      });
    }, 500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);
  return query && result?.query === query ? result.images : undefined;
}

export interface PhotoProps {
  /** What the photo shows. It is the alt text, and the search when there is no src or it fails. */
  query: string;
  /** An http(s) URL. */
  src?: string | null;
  /** Width over height, 0.2 to 5 (default 1.5). */
  aspectRatio?: number | null;
  /** A radius token or px (default "lg"). */
  radius?: Radius | null;
  /** cover (the default) crops to the box; contain shows the whole photo. */
  fit?: "cover" | "contain" | null;
}

/** A photo from src, or, without one or when it fails, the best search result for query. */
export function Photo(props: PhotoProps) {
  const alt = typeof props.query === "string" ? props.query.trim() : "";
  const src = webUrl(props.src);
  const [failed, setFailed] = useState<string[]>([]);
  const [loaded, setLoaded] = useState<string | null>(null);
  const needSearch = (!src || failed.includes(src)) && alt.length > 2;
  const found = useImageSearch(needSearch ? alt : null);
  const current = [src, ...(found ?? [])].find((url): url is string => !!url && !failed.includes(url));
  const settled = !current && (!needSearch || found !== undefined);
  const ratio = typeof props.aspectRatio === "number" && props.aspectRatio > 0.2 && props.aspectRatio < 5 ? props.aspectRatio : 1.5;
  return (
    <div
      className={cx("openui-intelligent-photo", props.fit === "contain" && "is-contain", loaded === current && "is-loaded")}
      style={{ aspectRatio: ratio, borderRadius: radius(props.radius ?? "lg") }}
      role={current ? undefined : "img"}
      aria-label={current ? undefined : alt}
    >
      {current ? (
        <img
          key={current}
          src={current}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(current)}
          onError={() => setFailed((list) => [...list, current])}
        />
      ) : settled ? (
        <ImageIcon aria-hidden className="openui-intelligent-photo-empty" strokeWidth={1.5} />
      ) : null}
    </div>
  );
}
