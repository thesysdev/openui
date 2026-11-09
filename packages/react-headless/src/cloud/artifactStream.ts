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
  /** The stored version `program` is, so a script runs against the one on screen. */
  version?: string;
  isStreaming: boolean;
  error: ArtifactStreamError | null;
  /**
   * Goes up when every renderer of this artifact should run its data calls
   * again: one was refused for an older version than the one on screen.
   */
  rerun?: number;
  /**
   * A data call was refused for the version on screen, and reading the artifact
   * again gave that version back: the refusal is real. Renderers show the
   * refusals they held.
   */
  versionMismatch?: boolean;
}

/** What a renderer does with a refused data call: keep it back, drop it, or show it. @category Types */
export type VersionMismatchVerdict = "hold" | "drop" | "show";

interface Entry {
  snapshot: ArtifactStreamSnapshot;
  listeners: Set<() => void>;
  controller: AbortController | null;
  started: boolean;
  /** The version being streamed, from its `reference`. */
  version?: string;
  /** First generation streams into `program`; edits and refreshes into `pending`. */
  target: "program" | "pending";
  pending: string;
  /** Reconnected into the version being streamed: the next delta has all of it, so it replaces. */
  replace: boolean;
  reconnects: number;
  versions: Set<string>;
  /** A newer revision was seen while a stream was still running. */
  stale: boolean;
  idleTimer: ReturnType<typeof setTimeout> | null;
  /** Recovery from refused data calls (`versionMismatch`), shared by every renderer. */
  recovery: "idle" | "recovering" | "gave-up";
  /** Refused versions this recovery already acted on. */
  handled: Set<string>;
  /** The refused version a re-read is under way for. */
  rereading: string | null;
  /** The version on screen the last `rerun` was for. */
  rerunFor: string | undefined;
  /** When the last automatic re-read started. */
  rereadAt: number;
}

const MAX_RECONNECTS = 3;
/**
 * At most one automatic re-read per artifact this often. A successful call
 * starts a new recovery, so without it a dashboard whose direct tool calls
 * succeed while its scripts are refused could re-read without end.
 */
const REREAD_INTERVAL_MS = 10_000;
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
 *
 * @internal Exported for its tests; renderers use it through `useArtifactStream`.
 */
export class ArtifactStreamStore {
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
      // A reopened artifact gets its own recovery.
      entry.recovery = "idle";
      entry.handled = new Set();
      entry.rereading = null;
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
    // A stream that already ended can still hold its controller for a few
    // microtasks; mark only a running one, or the new version is never read.
    if (entry.controller && entry.snapshot.isStreaming) entry.stale = true;
    else void this.connect(id);
  }

  retry(id: string): void {
    const entry = this.entry(id);
    entry.reconnects = 0;
    entry.started = true;
    void this.connect(id);
  }

  /**
   * A renderer's data call was refused because the artifact moved on
   * (OpenUI Cloud's `ARTIFACT_VERSION_MISMATCH`), for `version`. One recovery
   * for all the artifact's renderers:
   * - an older version than the one on screen: every renderer runs its calls
   *   again (`rerun`), once per version on screen;
   * - the version on screen: the artifact is read once more, and the refusals
   *   are held until it's back. A newer version re-runs the calls; the same
   *   version is a real mismatch (`versionMismatch`), and the held refusals show.
   * Late refusals for a version already handled, or for an older version once
   * the calls ran again for the one on screen, are dropped. A refusal for the
   * version the recovery reached shows, with no further reads, until a call
   * succeeds (`dataSucceeded`); and the artifact is re-read at most once every
   * {@link REREAD_INTERVAL_MS}. So a server whose versions keep changing can't
   * loop.
   */
  versionMismatch(id: string, version: string): VersionMismatchVerdict {
    const entry = this.entry(id);
    if (entry.rereading === version) return "hold";
    const onScreen = entry.snapshot.version;
    // A call made before the calls ran again for the version on screen.
    if (version !== onScreen && onScreen !== undefined && entry.rerunFor === onScreen) {
      entry.handled.add(version);
      return "drop";
    }
    if (entry.recovery === "recovering" && entry.handled.has(version)) return "drop";
    if (entry.recovery === "idle") {
      if (version !== onScreen) {
        entry.recovery = "recovering";
        entry.handled.add(version);
        this.rerun(id, onScreen);
        return "drop";
      }
      const now = Date.now();
      if (entry.started && now - entry.rereadAt >= REREAD_INTERVAL_MS) {
        entry.recovery = "recovering";
        entry.handled.add(version);
        entry.rereading = version;
        entry.rereadAt = now;
        this.refresh(id);
        return "hold";
      }
      return "show";
    }
    // The version the recovery reached was refused too.
    entry.recovery = "gave-up";
    return "show";
  }

  /** A data call succeeded: the next refusal starts a new recovery. */
  dataSucceeded(id: string): void {
    const entry = this.entry(id);
    if (entry.recovery === "idle") return;
    entry.recovery = "idle";
    if (entry.snapshot.versionMismatch) this.update(id, { versionMismatch: false });
  }

  /** Every renderer runs its data calls again, once per version on screen. */
  private rerun(id: string, version: string | undefined): void {
    const entry = this.entry(id);
    if (version !== undefined && entry.rerunFor === version) return;
    entry.rerunFor = version;
    this.update(id, { rerun: (entry.snapshot.rerun ?? 0) + 1, versionMismatch: false });
  }

  /** A read ended: settle a re-read started by `versionMismatch`. */
  private afterRead(id: string): void {
    const entry = this.entry(id);
    const refused = entry.rereading;
    if (refused === null || entry.snapshot.isStreaming) return;
    entry.rereading = null;
    if (entry.snapshot.version !== refused) this.rerun(id, entry.snapshot.version);
    else {
      entry.recovery = "gave-up";
      this.update(id, { versionMismatch: true });
    }
  }

  /**
   * Reads the artifact again. A stream in progress picks the new version up
   * when it ends; otherwise it's fetched now.
   */
  refresh(id: string): void {
    const entry = this.entry(id);
    if (!entry.started) return;
    if (entry.controller && entry.snapshot.isStreaming) entry.stale = true;
    else {
      entry.reconnects = 0;
      void this.connect(id);
    }
  }

  /**
   * True while `version` is one `noteVersion` hasn't recorded yet: the program
   * on screen is behind, and its data calls would run against a version the
   * storage no longer has. Clears once `noteVersion` records it and fetches it.
   * False while no version is recorded, since `noteVersion` fetches nothing for
   * the first one.
   */
  awaits(id: string, version: string | undefined): boolean {
    if (!version) return false;
    const entry = this.entry(id);
    return (
      entry.started &&
      entry.snapshot.program !== null &&
      entry.versions.size > 0 &&
      !entry.versions.has(version)
    );
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
        replace: false,
        reconnects: 0,
        versions: new Set(),
        stale: false,
        idleTimer: null,
        recovery: "idle",
        handled: new Set(),
        rereading: null,
        rerunFor: undefined,
        rereadAt: -Infinity,
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
      for await (const event of this.storage.stream(id, { signal: controller.signal })) {
        if (controller.signal.aborted) return;
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
    this.afterRead(id);
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
    this.afterRead(id);
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
        const version = event.data?.version;
        // The versions the stream delivers count as seen, so an edit's version
        // noted later is "newer", not "first", for an artifact opened by id.
        if (version) entry.versions.add(version);
        // A reconnect into the version being streamed sends it whole again.
        entry.replace = version !== undefined && version === entry.version;
        entry.version = version;
        if (!entry.replace) {
          entry.target = snapshot.program === null ? "program" : "pending";
          entry.pending = "";
        }
        this.update(id, {
          type: event.data?.type ?? snapshot.type,
          title: event.data?.title ?? snapshot.title,
          ...(entry.target === "program" ? { program: "", version } : {}),
        });
        return;
      }
      case "delta": {
        const text = event.data?.text;
        if (typeof text !== "string") return;
        const replace = entry.replace;
        entry.replace = false;
        // Edits stay hidden until `end`, so the current version stays on screen.
        if (entry.target === "pending") entry.pending = (replace ? "" : entry.pending) + text;
        else this.update(id, { program: (replace ? "" : (snapshot.program ?? "")) + text });
        return;
      }
      case "end": {
        const swapped =
          entry.target === "pending" ? { program: entry.pending, version: entry.version } : {};
        entry.target = "program";
        entry.pending = "";
        entry.version = undefined;
        this.update(id, { ...swapped, isStreaming: false });
        this.catchUp(id);
        this.afterRead(id);
        return;
      }
      case "error": {
        entry.target = "program";
        entry.pending = "";
        entry.version = undefined;
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
        this.afterRead(id);
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
  /**
   * Report a data call refused because the artifact moved on, for `version`.
   * Says whether to hold the refusal, drop it, or show it; see `rerun` and
   * `versionMismatch`. Undefined for an artifact in your own storage.
   */
  reportVersionMismatch?: (version: string) => VersionMismatchVerdict;
  /** Report a data call that succeeded. */
  reportDataSuccess?: () => void;
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
 * @internal Used by the `@openuidev/react-ui/cloud` renderers.
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
  // Read while rendering: `noteVersion` runs after the renderer's own effects,
  // which would otherwise run the old program's queries with its old version.
  const awaiting = store && id ? store.awaits(id, version) : false;
  const reportVersionMismatch = useMemo(
    () =>
      store && id
        ? (refused: string): VersionMismatchVerdict => store.versionMismatch(id, refused)
        : undefined,
    [store, id],
  );
  const reportDataSuccess = useMemo(
    () => (store && id ? () => store.dataSucceeded(id) : undefined),
    [store, id],
  );

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
    return {
      ...rest,
      isStreaming: rest.isStreaming || awaiting,
      retry,
      reportVersionMismatch,
      reportDataSuccess,
    };
  }, [
    ownContent,
    content,
    snapshot,
    id,
    storage,
    store,
    awaiting,
    reportVersionMismatch,
    reportDataSuccess,
  ]);
}
