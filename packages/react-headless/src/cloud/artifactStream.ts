import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import type { ArtifactStorage, ArtifactStreamEvent } from "../adapters/types";
import { useArtifactStorage } from "../store/ArtifactStorageContext";

/** Why an artifact can't be shown. @category Types */
export type ArtifactStreamErrorCode =
  "not-found" | "generation-failed" | "network-error" | "unauthorized";

/** @category Types */
export interface ArtifactStreamError {
  source: "artifact";
  code: ArtifactStreamErrorCode;
  message: string;
  /** The underlying error, for logs. `message` is meant for users. */
  cause?: unknown;
}

/** An artifact as it streams in. Replaced on every change, never mutated. @category Types */
export interface ArtifactStreamSnapshot {
  id: string;
  type?: string;
  title?: string;
  /** The program to render. `null` until the first content arrives. */
  program: string | null;
  isStreaming: boolean;
  error: ArtifactStreamError | null;
}

interface Entry {
  snapshot: ArtifactStreamSnapshot;
  listeners: Set<() => void>;
  controller: AbortController | null;
  started: boolean;
  lastEventId?: string;
  /** First generation streams into `program`; edits and refreshes into `pending`. */
  target: "program" | "pending";
  pending: string;
  reconnects: number;
  versions: Set<string>;
  /** A newer revision was seen while a stream was still running. */
  stale: boolean;
  idleTimer: ReturnType<typeof setTimeout> | null;
}

const MAX_RECONNECTS = 3;
/** A connection that stayed open this long was healthy, so its drop doesn't count against `MAX_RECONNECTS`. */
const STABLE_CONNECTION_MS = 10_000;
const ERROR_CODES = new Set<string>([
  "not-found",
  "generation-failed",
  "network-error",
  "unauthorized",
]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const streamError = (
  code: ArtifactStreamErrorCode,
  message: string,
  cause?: unknown,
): ArtifactStreamError => ({
  source: "artifact",
  code,
  message,
  ...(cause !== undefined && { cause }),
});

/**
 * One stream per artifact, shared by every renderer showing it, so an edit
 * streamed by one renderer updates them all. Reads `storage.stream` when the
 * storage has it, and falls back to `storage.get` otherwise.
 */
class ArtifactStreamStore {
  private readonly entries = new Map<string, Entry>();

  constructor(private readonly storage: ArtifactStorage) {}

  getSnapshot(id: string): ArtifactStreamSnapshot {
    return this.entry(id).snapshot;
  }

  subscribe(id: string, listener: () => void): () => void {
    const entry = this.entry(id);
    entry.listeners.add(listener);
    if (entry.idleTimer) {
      clearTimeout(entry.idleTimer);
      entry.idleTimer = null;
    }
    if (!entry.started) {
      entry.started = true;
      void this.connect(id);
    }
    return () => {
      entry.listeners.delete(listener);
      if (entry.listeners.size > 0 || !entry.controller) return;
      // Deferred, so a StrictMode remount doesn't drop the stream.
      entry.idleTimer = setTimeout(() => {
        entry.idleTimer = null;
        if (entry.listeners.size > 0 || !entry.controller) return;
        entry.controller.abort();
        entry.controller = null;
        // Keep `lastEventId`, so the next subscriber resumes where this left off.
        entry.started = false;
      }, 0);
    };
  }

  /** A version not seen before means there's a newer revision to fetch. */
  noteVersion(id: string, version: string | undefined): void {
    if (!version) return;
    const entry = this.entry(id);
    if (entry.versions.has(version)) return;
    const isFirst = entry.versions.size === 0;
    entry.versions.add(version);
    if (isFirst || !entry.started) return;
    if (entry.controller) entry.stale = true;
    else void this.connect(id);
  }

  retry(id: string): void {
    const entry = this.entry(id);
    entry.reconnects = 0;
    entry.started = true;
    void this.connect(id);
  }

  private entry(id: string): Entry {
    let entry = this.entries.get(id);
    if (!entry) {
      entry = {
        snapshot: { id, program: null, isStreaming: false, error: null },
        listeners: new Set(),
        controller: null,
        started: false,
        target: "program",
        pending: "",
        reconnects: 0,
        versions: new Set(),
        stale: false,
        idleTimer: null,
      };
      this.entries.set(id, entry);
    }
    return entry;
  }

  private update(id: string, patch: Partial<ArtifactStreamSnapshot>): void {
    const entry = this.entry(id);
    entry.snapshot = { ...entry.snapshot, ...patch };
    entry.listeners.forEach((listener) => listener());
  }

  private async connect(id: string): Promise<void> {
    const entry = this.entry(id);
    entry.controller?.abort();
    const controller = new AbortController();
    entry.controller = controller;
    this.update(id, { isStreaming: true, error: null });

    const connectedAt = Date.now();
    let finished = false;
    let failure: unknown;
    try {
      if (!this.storage.stream) {
        finished = true;
        await this.load(id);
        return;
      }
      for await (const event of this.storage.stream(id, {
        lastEventId: entry.lastEventId,
        signal: controller.signal,
      })) {
        if (controller.signal.aborted) return;
        if (event.eventId) entry.lastEventId = event.eventId;
        if (event.type === "end" || event.type === "error") {
          finished = true;
          this.onEvent(id, event);
          break;
        }
        this.onEvent(id, event);
        entry.reconnects = 0;
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      failure = error;
    } finally {
      if (entry.controller === controller) entry.controller = null;
    }
    if (finished || controller.signal.aborted) return;

    // The stream dropped before it ended: resume after a backoff, then give up.
    // Proxies cut streams that go quiet, as an edit's does until it's done, so a
    // connection that stayed up a while starts the count again.
    if (Date.now() - connectedAt >= STABLE_CONNECTION_MS) entry.reconnects = 0;
    if (entry.reconnects < MAX_RECONNECTS) {
      entry.reconnects += 1;
      await sleep(500 * 2 ** (entry.reconnects - 1));
      // A new version may have reconnected already.
      if (entry.controller) return;
      if (entry.listeners.size > 0) void this.connect(id);
      else entry.started = false;
      return;
    }
    this.update(id, {
      isStreaming: false,
      error: streamError("network-error", "Couldn't reach the artifact's storage.", failure),
    });
  }

  /** Storages without `stream`: read the stored artifact once. */
  private async load(id: string): Promise<void> {
    try {
      const artifact = await this.storage.get(id);
      this.update(id, {
        type: artifact.type,
        title: artifact.title,
        program: typeof artifact.content === "string" ? artifact.content : null,
        isStreaming: false,
      });
    } catch (error) {
      this.update(id, {
        isStreaming: false,
        error: streamError(
          "not-found",
          error instanceof Error ? error.message : "This artifact couldn't be loaded.",
          error,
        ),
      });
    }
  }

  /** Fetches a revision noted while the stream that just ended was running. */
  private catchUp(id: string): void {
    const entry = this.entry(id);
    if (!entry.stale) return;
    entry.stale = false;
    void this.connect(id);
  }

  private onEvent(id: string, event: ArtifactStreamEvent): void {
    const entry = this.entry(id);
    const snapshot = entry.snapshot;
    switch (event.type) {
      case "reference": {
        entry.target = snapshot.program === null ? "program" : "pending";
        entry.pending = "";
        this.update(id, {
          type: event.data?.type ?? snapshot.type,
          title: event.data?.title ?? snapshot.title,
          ...(entry.target === "program" ? { program: "" } : {}),
        });
        return;
      }
      case "delta": {
        const text = event.data?.text;
        if (typeof text !== "string") return;
        // Edits stay hidden until `end`, so the current version stays on screen.
        if (entry.target === "pending") entry.pending += text;
        else this.update(id, { program: (snapshot.program ?? "") + text });
        return;
      }
      case "end": {
        const swapped = entry.target === "pending" ? { program: entry.pending } : {};
        entry.target = "program";
        entry.pending = "";
        entry.lastEventId = undefined;
        this.update(id, { ...swapped, isStreaming: false });
        this.catchUp(id);
        return;
      }
      case "error": {
        entry.target = "program";
        entry.pending = "";
        entry.lastEventId = undefined;
        const code = event.data?.code;
        const errorCode =
          code && ERROR_CODES.has(code) ? (code as ArtifactStreamErrorCode) : "generation-failed";
        this.update(id, {
          isStreaming: false,
          error: streamError(
            errorCode,
            event.data?.message ?? "The artifact couldn't be generated.",
          ),
        });
        this.catchUp(id);
      }
    }
  }
}

const stores = new WeakMap<ArtifactStorage, ArtifactStreamStore>();
const storeFor = (storage: ArtifactStorage): ArtifactStreamStore => {
  let store = stores.get(storage);
  if (!store) {
    store = new ArtifactStreamStore(storage);
    stores.set(storage, store);
  }
  return store;
};

/** @category Types */
export interface UseArtifactStreamOptions {
  /** The artifact to show. */
  id: string | null | undefined;
  /** The version from the artifact's tool response. A new one fetches the newer revision. */
  version?: string;
  /** The artifact's saved content, when you keep artifacts in your own storage. Never streams. */
  content?: string;
}

/** @category Types */
export interface ArtifactStreamState extends Omit<ArtifactStreamSnapshot, "id"> {
  /** Reconnects after a `network-error`. Undefined when there's nothing to retry. */
  retry?: () => void;
}

const IDLE: ArtifactStreamState = { program: null, isStreaming: false, error: null };

/**
 * Streams an artifact in by id from the configured {@link ArtifactStorage},
 * sharing one stream per artifact across every component that shows it.
 *
 * - While it's generated, `program` grows and `isStreaming` is `true`.
 * - After a reload, it replays everything generated so far, then continues.
 * - During an edit, `program` keeps the current version until the new one ends.
 * - Storages without `stream` are read once with `get`.
 *
 * @category Hooks
 */
export function useArtifactStream({
  id,
  version,
  content,
}: UseArtifactStreamOptions): ArtifactStreamState {
  const storage = useArtifactStorage();
  const ownContent = content !== undefined;
  const store = storage && !ownContent && id ? storeFor(storage) : null;

  const subscribe = useCallback(
    (listener: () => void) => (store && id ? store.subscribe(id, listener) : () => {}),
    [store, id],
  );
  const getSnapshot = useCallback(() => (store && id ? store.getSnapshot(id) : null), [store, id]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (store && id) store.noteVersion(id, version);
  }, [store, id, version]);

  return useMemo<ArtifactStreamState>(() => {
    if (ownContent) return { program: content, isStreaming: false, error: null };
    if (!snapshot) {
      if (id && !storage) {
        return {
          ...IDLE,
          error: streamError("not-found", "No artifact storage is configured."),
        };
      }
      return IDLE;
    }
    const { id: _id, ...rest } = snapshot;
    const retry =
      snapshot.error?.code === "network-error" && store && id ? () => store.retry(id) : undefined;
    return { ...rest, retry };
  }, [ownContent, content, snapshot, id, storage, store]);
}
