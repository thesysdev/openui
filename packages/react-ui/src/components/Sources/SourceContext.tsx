import { createContext, Key, ReactNode, useContext, useMemo } from "react";
import { z } from "zod/v4";
import { safeOpenUrl } from "../_shared/utils";

export const CardSourceSchema = z.object({
  url: z.string().optional(),
  title: z.string(),
  sourceName: z.string(),
});

export type CardSource = z.infer<typeof CardSourceSchema>;

export interface SourceWithFavicon extends CardSource {
  faviconUrl: string;
  key?: Key;
}

export const openSourceInNewTab = (url?: string) => {
  safeOpenUrl(url);
};

/**
 * React context that provides enriched source data to child components.
 * Contains sources with favicon URLs, source IDs, and validation status.
 */
export const CardSourceContext = createContext<SourceWithFavicon[] | undefined>(undefined);

/**
 * Returns the favicon URL for a given website using Google's favicon service.
 *
 * Attempts to parse the provided URL string and extract the hostname (domain).
 * If parsing succeeds, returns a URL (with size 128) from Google's s2/favicons API.
 * If the URL is invalid or parsing fails, returns an empty string.
 */
export const getFaviconUrl = (url?: string) => {
  try {
    if (!url) {
      return "";
    }
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;
    return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
  } catch {
    return "";
  }
};

/**
 * Context provider that enriches sources with favicon URLs.
 * Generates favicon URLs from Google's service for each source.
 */
export const CardSourceProvider = ({
  sources,
  children,
}: {
  sources: CardSource[] | undefined;
  children: ReactNode;
}) => {
  const enrichedSources = useMemo<SourceWithFavicon[]>(() => {
    return (
      sources?.map((source) => ({
        ...source,
        faviconUrl: getFaviconUrl(source.url),
      })) ?? []
    );
  }, [sources]);

  return (
    <CardSourceContext.Provider value={enrichedSources}>{children}</CardSourceContext.Provider>
  );
};

/**
 * Hook to access all enriched sources from CardSourceContext.
 * Returns array of SourceWithFavicon objects, or empty array if context unavailable.
 */
export const useCardSourceContext = (): SourceWithFavicon[] => {
  const context = useContext(CardSourceContext);
  return context ?? [];
};
