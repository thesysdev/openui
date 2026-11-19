"use client";

import { useArtifactStorage, type ArtifactStorage } from "@openuidev/react-headless";
import { useCallback, useMemo, useRef, useState } from "react";
import { cacheFor, type ArtifactCache } from "./artifactCache";

/** Whether a change is in flight, and why the last one failed. */
export interface ArtifactActionState {
  isPending: boolean;
  error: Error | null;
}

const NO_STORAGE = "No artifact storage is configured: wrap your app in <OpenUICloudProvider>.";

/**
 * Runs one kind of change against the storage. `run` updates the cache that every list and
 * renderer on the same storage shares, so the change shows everywhere at once, then saves it
 * and puts the cache back if the save fails. Failures reject, and set `error`.
 */
function useArtifactAction<Args extends unknown[]>(
  run: (storage: ArtifactStorage, cache: ArtifactCache, ...args: Args) => Promise<void>,
) {
  const storage = useArtifactStorage();
  const cache = useMemo(() => (storage ? cacheFor(storage) : null), [storage]);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const runRef = useRef(run);
  runRef.current = run;

  const act = useCallback(
    async (...args: Args) => {
      if (!storage || !cache) throw new Error(NO_STORAGE);
      setPending((count) => count + 1);
      setError(null);
      try {
        await runRef.current(storage, cache, ...args);
      } catch (cause) {
        const failure = cause instanceof Error ? cause : new Error(String(cause));
        setError(failure);
        throw failure;
      } finally {
        setPending((count) => count - 1);
      }
    },
    [storage, cache],
  );
  return { act, state: { isPending: pending > 0, error } satisfies ArtifactActionState };
}

async function setPinned(
  storage: ArtifactStorage,
  cache: ArtifactCache,
  id: string,
  next: boolean,
) {
  const method = next ? storage.pin : storage.unpin;
  if (!method) throw new Error(`This storage can't ${next ? "pin" : "unpin"} artifacts.`);
  const previous = cache.get(id)?.pinned;
  cache.patch(id, { pinned: next });
  try {
    cache.put([await method.call(storage, id)]);
  } catch (cause) {
    cache.patch(id, { pinned: previous });
    throw cause;
  }
}

/**
 * Pins an artifact for the user. Lists and renderers showing it update right away, and revert
 * if it fails.
 *
 * @category Hooks
 */
export function useArtifactPin(): ArtifactActionState & { pin: (id: string) => Promise<void> } {
  const { act, state } = useArtifactAction((storage, cache, id: string) =>
    setPinned(storage, cache, id, true),
  );
  return { ...state, pin: act };
}

/**
 * Unpins an artifact. Lists and renderers showing it update right away, and revert if it fails.
 *
 * @category Hooks
 */
export function useArtifactUnpin(): ArtifactActionState & {
  unpin: (id: string) => Promise<void>;
} {
  const { act, state } = useArtifactAction((storage, cache, id: string) =>
    setPinned(storage, cache, id, false),
  );
  return { ...state, unpin: act };
}

/**
 * Deletes an artifact. Lists drop it and renderers showing it say it was deleted right away;
 * it comes back if the delete fails.
 *
 * @category Hooks
 */
export function useArtifactDelete(): ArtifactActionState & {
  deleteArtifact: (id: string) => Promise<void>;
} {
  const { act, state } = useArtifactAction(async (storage, cache, id: string) => {
    if (!storage.delete) throw new Error("This storage can't delete artifacts.");
    const previous = cache.get(id);
    cache.remove(id);
    try {
      await storage.delete(id);
    } catch (cause) {
      if (previous) cache.restore(previous);
      throw cause;
    }
  });
  return { ...state, deleteArtifact: act };
}

/** What `update` changes: a new title, new content, or both. */
export interface ArtifactUpdate {
  title?: string;
  /** The edited program. New content is a new version. */
  content?: unknown;
}

/**
 * Renames an artifact or saves edited content. A new title shows in lists and renderers right
 * away and reverts if the save fails.
 *
 * @category Hooks
 */
export function useArtifactUpdate(): ArtifactActionState & {
  update: (id: string, changes: ArtifactUpdate) => Promise<void>;
} {
  const { act, state } = useArtifactAction(
    async (storage, cache, id: string, { title, content }: ArtifactUpdate) => {
      const previous = cache.get(id)?.title;
      if (title !== undefined) cache.patch(id, { title });
      try {
        cache.put([
          await storage.update({
            id,
            ...(title !== undefined && { title }),
            ...(content !== undefined && { content }),
          }),
        ]);
      } catch (cause) {
        if (title !== undefined && previous !== undefined) cache.patch(id, { title: previous });
        throw cause;
      }
    },
  );
  return { ...state, update: act };
}
