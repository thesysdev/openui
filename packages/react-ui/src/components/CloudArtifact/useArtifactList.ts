"use client";

import { useArtifactStorage, type ArtifactSummary } from "@openuidev/react-headless";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { cacheFor } from "./artifactCache";

export interface ArtifactListFilter {
  /** Only these kinds of artifact, such as `"live"`. */
  type?: string | string[];
  /** Only pinned (`true`) or unpinned (`false`) artifacts. */
  pinned?: boolean;
  /** Match on the title. */
  search?: string;
  /** Page size. */
  limit?: number;
}

export interface UseArtifactListOptions {
  filter?: ArtifactListFilter;
}

export interface ArtifactListState {
  /** The artifacts loaded so far, newest first. */
  artifacts: ArtifactSummary[];
  isLoading: boolean;
  error: Error | null;
  /** Whether there are more to load. */
  hasMore: boolean;
  loadMore: () => void;
  /** Loads the list again from the first page. */
  refresh: () => void;
  /** Pin an artifact. Shows everywhere right away; reverts if it fails. */
  pin: (id: string) => Promise<void>;
  unpin: (id: string) => Promise<void>;
  /** Delete an artifact. Lists and renderers showing it update right away; reverts if it fails. */
  deleteArtifact: (id: string) => Promise<void>;
}

const NO_STORAGE = new Error(
  "No artifact storage is configured: wrap your app in <OpenUICloudProvider>.",
);
const noopSubscribe = () => () => {};
const zero = () => 0;

/**
 * Lists the user's artifacts in OpenUI Cloud, page by page, with pin, unpin
 * and delete. Every list and renderer on the same storage shares one cache.
 *
 * @category Hooks
 */
export function useArtifactList({ filter }: UseArtifactListOptions = {}): ArtifactListState {
  const storage = useArtifactStorage();
  const cache = useMemo(() => (storage ? cacheFor(storage) : null), [storage]);
  const version = useSyncExternalStore(
    cache?.subscribe ?? noopSubscribe,
    cache?.getVersion ?? zero,
    zero,
  );

  const types = filter?.type === undefined ? undefined : [filter.type].flat();
  const typeKey = types?.join(" ");
  const { pinned, search, limit } = filter ?? {};

  const [ids, setIds] = useState<string[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(Boolean(storage));
  const [error, setError] = useState<Error | null>(storage ? null : NO_STORAGE);
  const [reloads, setReloads] = useState(0);
  // Responses for an older filter are dropped.
  const requestRef = useRef(0);

  const load = useCallback(
    async (after: string | undefined) => {
      if (!storage || !cache) return;
      const request = ++requestRef.current;
      setIsLoading(true);
      setError(null);
      try {
        const page = await storage.list({
          ...(typeKey !== undefined && { type: typeKey.split(" ") }),
          ...(pinned !== undefined && { pinned }),
          ...(search && { name: search }),
          ...(limit !== undefined && { limit }),
          ...(after !== undefined && { cursor: after }),
        });
        if (request !== requestRef.current) return;
        cache.put(page.artifacts);
        const pageIds = page.artifacts.map((artifact) => artifact.id);
        setIds((current) => (after === undefined ? pageIds : [...current, ...pageIds]));
        setCursor(page.nextCursor);
      } catch (cause) {
        if (request !== requestRef.current) return;
        setError(cause instanceof Error ? cause : new Error(String(cause)));
      } finally {
        if (request === requestRef.current) setIsLoading(false);
      }
    },
    [storage, cache, typeKey, pinned, search, limit],
  );

  useEffect(() => {
    if (!storage) {
      setError(NO_STORAGE);
      setIsLoading(false);
      return;
    }
    setIds([]);
    setCursor(undefined);
    void load(undefined);
  }, [storage, load, reloads]);

  const loadMore = useCallback(() => {
    if (cursor !== undefined && !isLoading) void load(cursor);
  }, [cursor, isLoading, load]);
  const refresh = useCallback(() => setReloads((count) => count + 1), []);

  const setPinned = useCallback(
    async (id: string, next: boolean) => {
      const method = next ? storage?.pin : storage?.unpin;
      if (!storage || !cache || !method) throw new Error("This storage can't pin artifacts.");
      const previous = cache.get(id)?.pinned;
      cache.patch(id, { pinned: next });
      try {
        cache.put([await method.call(storage, id)]);
      } catch (cause) {
        cache.patch(id, { pinned: previous });
        throw cause;
      }
    },
    [storage, cache],
  );
  const pin = useCallback((id: string) => setPinned(id, true), [setPinned]);
  const unpin = useCallback((id: string) => setPinned(id, false), [setPinned]);

  const deleteArtifact = useCallback(
    async (id: string) => {
      if (!storage || !cache || !storage.delete) {
        throw new Error("This storage can't delete artifacts.");
      }
      const previous = cache.get(id);
      cache.remove(id);
      try {
        await storage.delete(id);
      } catch (cause) {
        if (previous) cache.restore(previous);
        throw cause;
      }
    },
    [storage, cache],
  );

  // Read through the cache, so pins and deletes from anywhere show here too.
  const artifacts = useMemo(() => {
    if (!cache) return [];
    const query = search?.toLowerCase();
    const matches = (summary: ArtifactSummary) =>
      (pinned === undefined || Boolean(summary.pinned) === pinned) &&
      (typeKey === undefined || typeKey.split(" ").includes(summary.type)) &&
      (!query || summary.title.toLowerCase().includes(query));
    const listed = ids.flatMap((id) => {
      const summary = cache.get(id);
      return summary && !cache.isDeleted(id) && matches(summary) ? [summary] : [];
    });
    if (pinned === undefined) return listed;
    // A pin elsewhere can add an artifact this list didn't load: show it first.
    const loaded = new Set(ids);
    const joined = cache.all().filter((summary) => !loaded.has(summary.id) && matches(summary));
    return [...joined, ...listed];
    // `version` changes whenever the cache does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, cache, pinned, typeKey, search, version]);

  return {
    artifacts,
    isLoading,
    error,
    hasMore: cursor !== undefined,
    loadMore,
    refresh,
    pin,
    unpin,
    deleteArtifact,
  };
}
