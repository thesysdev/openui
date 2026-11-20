"use client";

import {
  useArtifactStorage,
  type ArtifactAccess,
  type ArtifactShare,
  type ArtifactShareTarget,
  type ArtifactStorage,
  type ArtifactSummary,
} from "@openuidev/react-headless";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { NO_STORAGE, useArtifactAction, type ArtifactActionState } from "./artifactActions";
import { cacheFor, type ArtifactCache } from "./artifactCache";

export interface ArtifactSharesState {
  /** Who the artifact is shared with. Empty for users who can't edit it. */
  shares: ArtifactShare[];
  isLoading: boolean;
  error: Error | null;
  /** Loads the artifact again, with its shares. */
  refresh: () => void;
}

const NO_SHARES: ArtifactShare[] = [];
const noopSubscribe = () => () => {};

/** One key per target: a target has one share at most. */
function targetKey(target: ArtifactShareTarget): string {
  return `${target.type}:${target.id}`;
}

/** The artifact as lists cache it: without its content. */
async function loadSummary(storage: ArtifactStorage, id: string): Promise<ArtifactSummary> {
  const { content: _content, ...summary } = await storage.get(id);
  return summary;
}

/** Share changes still saving, per artifact, and whether two of them overlapped. */
const savingByCache = new WeakMap<
  ArtifactCache,
  Map<string, { count: number; overlapped: boolean }>
>();

/**
 * Changes the cached artifact's shares at once, then saves the change. A change saved on its own
 * caches the artifact the storage returns, or puts the shares back if it fails. Overlapping
 * changes can answer out of order, and one failing says nothing about the others, so the last of
 * them to finish loads the artifact again instead.
 */
async function changeShares(
  storage: ArtifactStorage,
  cache: ArtifactCache,
  id: string,
  change: (shares: ArtifactShare[]) => ArtifactShare[],
  save: () => Promise<ArtifactSummary>,
) {
  let savingById = savingByCache.get(cache);
  if (!savingById) savingByCache.set(cache, (savingById = new Map()));
  const saving = savingById.get(id) ?? { count: 0, overlapped: false };
  saving.count += 1;
  saving.overlapped ||= saving.count > 1;
  savingById.set(id, saving);

  const previous = cache.get(id)?.shares;
  cache.patch(id, { shares: change(previous ?? []) });
  let saved: ArtifactSummary | undefined;
  try {
    saved = await save();
  } finally {
    saving.count -= 1;
    if (saving.count === 0) {
      savingById.delete(id);
      if (saving.overlapped) {
        // If this fails too, the shares stay as changed until the next load.
        void loadSummary(storage, id).then(
          (summary) => cache.put([summary]),
          () => {},
        );
      } else if (saved) {
        cache.put([saved]);
      } else {
        cache.patch(id, { shares: previous });
      }
    }
  }
}

/**
 * Who an artifact is shared with, from the artifact itself: lists already carry it, and an
 * artifact no list has loaded is loaded here. Only users who can edit it see its shares. Shares
 * added or removed with `useArtifactShare` and `useArtifactUnshare` show here at once.
 *
 * @category Hooks
 */
export function useArtifactShares(id: string): ArtifactSharesState {
  const storage = useArtifactStorage();
  const cache = useMemo(() => (storage ? cacheFor(storage) : null), [storage]);
  const summary = useSyncExternalStore(
    cache?.subscribe ?? noopSubscribe,
    () => cache?.get(id),
    () => undefined,
  );
  const [isLoading, setIsLoading] = useState(Boolean(cache && !cache.get(id)));
  const [error, setError] = useState<Error | null>(storage ? null : new Error(NO_STORAGE));
  // Responses for an older load are dropped.
  const requestRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!storage || !cache) return;
    const request = ++requestRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await loadSummary(storage, id);
      if (request === requestRef.current) cache.put([loaded]);
    } catch (cause) {
      if (request === requestRef.current) {
        setError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    } finally {
      if (request === requestRef.current) setIsLoading(false);
    }
  }, [storage, cache, id]);

  useEffect(() => {
    if (cache && !cache.get(id)) void refresh();
  }, [cache, id, refresh]);

  return { shares: summary?.shares ?? NO_SHARES, isLoading, error, refresh };
}

/**
 * Shares an artifact with a user or a group, or changes the access of a target it's already
 * shared with. Lists and `useArtifactShares` show it right away, and revert
 * if it fails.
 *
 * @category Hooks
 */
export function useArtifactShare(): ArtifactActionState & {
  share: (id: string, target: ArtifactShareTarget & { access: ArtifactAccess }) => Promise<void>;
} {
  const { act, state } = useArtifactAction(
    async (
      storage,
      cache,
      id: string,
      target: ArtifactShareTarget & { access: ArtifactAccess },
    ) => {
      const share = storage.share;
      if (!share) throw new Error("This storage can't share artifacts.");
      const key = targetKey(target);
      await changeShares(
        storage,
        cache,
        id,
        (shares) =>
          shares.some((existing) => targetKey(existing) === key)
            ? shares.map((existing) =>
                targetKey(existing) === key ? { ...existing, access: target.access } : existing,
              )
            : // The storage's answer says who shared it.
              [...shares, { ...target, createdBy: "", createdAt: Date.now() }],
        () => share.call(storage, id, target),
      );
    },
  );
  return { ...state, share: act };
}

/**
 * Removes a share. Lists and `useArtifactShares` drop it right away, and put it back if it
 * fails. Lists keep showing an artifact the user no longer has access to until they `refresh`.
 *
 * @category Hooks
 */
export function useArtifactUnshare(): ArtifactActionState & {
  unshare: (id: string, target: ArtifactShareTarget) => Promise<void>;
} {
  const { act, state } = useArtifactAction(
    async (storage, cache, id: string, target: ArtifactShareTarget) => {
      const unshare = storage.unshare;
      if (!unshare) throw new Error("This storage can't unshare artifacts.");
      const key = targetKey(target);
      await changeShares(
        storage,
        cache,
        id,
        (shares) => shares.filter((existing) => targetKey(existing) !== key),
        () => unshare.call(storage, id, target),
      );
    },
  );
  return { ...state, unshare: act };
}
