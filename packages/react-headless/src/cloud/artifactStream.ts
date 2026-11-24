import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import type {
  ArtifactBuildStep,
  ArtifactStorage,
  ArtifactStreamEvent,
  ArtifactSummary,
} from "../adapters/types";
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
export interface ArtifactStreamSnapshot extends Pick<ArtifactSummary, "isOwner" | "isEditable"> {
  id: string;
  type?: string;
  title?: string;
  /** The program to render. `null` until the first content arrives. */
  program: string | null;
  /** The stored version `program` is, so a script runs against the one on screen. */
  version?: string;
  isStreaming: boolean;
  /**
   * What a dashboard being built is doing, until it starts writing: the data tools it called
   * and the scripts it's saving. Undefined otherwise.
   */
  step?: ArtifactBuildStep;
  justUpdated: boolean;
  error: ArtifactStreamError | null;
}

/** Called on every change to an artifact's stream. @internal */
export type ArtifactStreamWatcher = (
  id: string,
  before: ArtifactStreamSnapshot,
  after: ArtifactStreamSnapshot,
) => void;

type Settled = { program: string; version?: string };

interface Entry {
  snapshot: ArtifactStreamSnapshot;
  listeners: Set<() => void>;
  controller: AbortController | null;
  started: boolean;
  /** The version being streamed, from its `reference`. */
  version?: string;
  /** A new version streams into `program`, live; the same version again loads into `pending`. */
  target: "program" | "pending";
  pending: string;
  replace: boolean;
  /** What was on screen before a new version started streaming over it. A failed edit goes back to it. */
  settled: Settled | null;
  reconnects: number;
  versions: Set<string>;
  /** A newer revision was seen while a stream was still running. */
  stale: boolean;
  idleTimer: ReturnType<typeof setTimeout> | null;
  /** A re-read started by `versionMismatch`, and its pending answer. */
  reread: { version: string; answer: Promise<"rerun" | "show">; settle: Settle } | null;
  rereadAt: number;
  /** The last reference's `tag`: what a poll asks the server to compare. */
  tag?: string;
  /** Each polling renderer's interval. The shortest one wins. */
  pollers: Map<symbol, number>;
  pollTimer: ReturnType<typeof setTimeout> | null;
  /** Polls failed in a row; each one doubles the wait. */
  pollFailures: number;
  /** Turns `justUpdated` off again. */
  justUpdatedTimer: ReturnType<typeof setTimeout> | null;
}

type Settle = (answer: "rerun" | "show") => void;

const MAX_RECONNECTS = 3;
/** Refused data calls re-read an artifact at most this often, so they can't loop. */
const REREAD_INTERVAL_MS = 10_000;
/** A connection that stayed open this long was healthy, so its drop doesn't count against `MAX_RECONNECTS`. */
const STABLE_CONNECTION_MS = 10_000;
const MIN_POLL_INTERVAL_MS = 3_000;
/** The longest `setTimeout` takes: a longer wait would fire at once. */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;
/** How long `justUpdated` stays on. */
const JUST_UPDATED_MS = 10_000;
const ERROR_CODES = new Set<string>([
  "not-found",
  "generation-failed",
  "network-error",
  "unauthorized",
]);

/** A step's names, or `undefined` for an empty or malformed one. */
const stepOf = (data: unknown): ArtifactBuildStep | undefined => {
  const names = (value: unknown) =>
    Array.isArray(value) ? value.filter((name): name is string => typeof name === "string") : [];
  const { tools, scripts } = (data ?? {}) as Partial<Record<keyof ArtifactBuildStep, unknown>>;
  const step = { tools: names(tools), scripts: names(scripts) };
  return step.tools.length > 0 || step.scripts.length > 0 ? step : undefined;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Deleted, or the user lost access. */
const isGone = (entry: Entry) => entry.snapshot.error?.code === "not-found";

/**
 * Whether to keep checking: a renderer polls, the server tags what it sends (older
 * servers and storages without `stream` don't), and the user is still signed in.
 */
const polls = (entry: Entry) =>
  entry.pollers.size > 0 &&
  entry.tag !== undefined &&
  entry.snapshot.error?.code !== "unauthorized";

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
 * @internal Exported for tests.
 */
export class ArtifactStreamStore {
  private readonly entries = new Map<string, Entry>();
  private readonly watchers = new Set<ArtifactStreamWatcher>();
  /** Artifacts whose poll came due while the tab was hidden. */
  private readonly dueWhileHidden = new Set<string>();

  constructor(private readonly storage: ArtifactStorage) {}

  /** Calls `watcher` on every change to any artifact's stream. Returns a function that stops it. */
  watch(watcher: ArtifactStreamWatcher): () => void {
    this.watchers.add(watcher);
    return () => this.watchers.delete(watcher);
  }

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
        entry.started = false;
      }, 0);
    };
  }

  poll(id: string, intervalMs: number): () => void {
    const entry = this.entry(id);
    const key = Symbol();
    entry.pollers.set(key, Math.max(intervalMs, MIN_POLL_INTERVAL_MS));
    this.schedulePoll(id);
    return () => {
      entry.pollers.delete(key);
      this.schedulePoll(id);
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
    // An ended stream can hold its controller a few microtasks longer.
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
   * A data call was refused for `version` (`ARTIFACT_VERSION_MISMATCH`). "rerun" if
   * a newer version is on screen or a re-read brings one; else "show". Renderers
   * refused together share one re-read.
   */
  versionMismatch(id: string, version: string): Promise<"rerun" | "show"> {
    const entry = this.entry(id);
    if (version !== entry.snapshot.version) return Promise.resolve("rerun");
    if (entry.reread?.version === version) return entry.reread.answer;
    const now = performance.now();
    if (!entry.started || now - entry.rereadAt < REREAD_INTERVAL_MS) {
      return Promise.resolve("show");
    }
    entry.rereadAt = now;
    let settle!: Settle;
    const answer = new Promise<"rerun" | "show">((resolve) => (settle = resolve));
    entry.reread = { version, answer, settle };
    this.refresh(id);
    return answer;
  }

  /** A read ended: answer a pending re-read. */
  private afterRead(id: string): void {
    const entry = this.entry(id);
    const reread = entry.reread;
    if (!reread || entry.snapshot.isStreaming) return;
    entry.reread = null;
    reread.settle(entry.snapshot.version === reread.version ? "show" : "rerun");
  }

  /** Reads the artifact again, after the running stream if there is one. */
  private refresh(id: string): void {
    const entry = this.entry(id);
    if (!entry.started) return;
    if (entry.controller && entry.snapshot.isStreaming) entry.stale = true;
    else {
      entry.reconnects = 0;
      void this.connect(id);
    }
  }

  /** True while `version` is newer than any version recorded: the program on screen is behind. */
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
        snapshot: { id, program: null, isStreaming: false, justUpdated: false, error: null },
        listeners: new Set(),
        controller: null,
        started: false,
        target: "program",
        pending: "",
        replace: false,
        settled: null,
        reconnects: 0,
        versions: new Set(),
        stale: false,
        idleTimer: null,
        reread: null,
        rereadAt: -Infinity,
        pollers: new Map(),
        pollTimer: null,
        pollFailures: 0,
        justUpdatedTimer: null,
      };
      this.entries.set(id, entry);
    }
    return entry;
  }

  private update(id: string, patch: Partial<ArtifactStreamSnapshot>): void {
    const entry = this.entry(id);
    const before = entry.snapshot;
    entry.snapshot = { ...before, ...patch };
    this.watchers.forEach((watcher) => watcher(id, before, entry.snapshot));
    entry.listeners.forEach((listener) => listener());
  }

  /** With `fetchLatest`, a poll: it stays quiet until the server sends something new. */
  private async connect(id: string, fetchLatest?: string): Promise<void> {
    const entry = this.entry(id);
    entry.started = true;
    entry.controller?.abort();
    const controller = new AbortController();
    entry.controller = controller;
    const poll = fetchLatest !== undefined;
    if (!poll) this.update(id, { isStreaming: true, error: null });

    const connectedAt = Date.now();
    let finished = false;
    let referenced = false;
    let failure: unknown;
    try {
      if (!this.storage.stream) {
        finished = true;
        await this.load(id);
        return;
      }
      for await (const event of this.storage.stream(id, {
        signal: controller.signal,
        fetchLatest,
      })) {
        if (controller.signal.aborted) return;
        if (event.type === "end" || event.type === "error" || event.type === "unchanged") {
          finished = true;
          this.onEvent(id, event);
          break;
        }
        if (event.type === "reference") referenced = true;
        this.onEvent(id, event);
        entry.reconnects = 0;
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      failure = error;
    } finally {
      if (entry.controller === controller) entry.controller = null;
    }
    if (controller.signal.aborted) return;
    // Done, or a poll that failed before anything changed (what's on screen stays): poll again
    // later. Each failure, and each check that finds the artifact still gone, doubles the wait.
    if (finished || (poll && !referenced)) {
      entry.pollFailures = finished && !isGone(entry) ? 0 : entry.pollFailures + 1;
      this.schedulePoll(id);
      return;
    }

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
      ...this.endRead(entry),
      isStreaming: false,
      error: streamError("network-error", "Couldn't reach the artifact's storage.", failure),
    });
    this.afterRead(id);
  }

  /**
   * A read is over: resets it, and returns what was on screen before a new version
   * started streaming over it, if one did. A read that failed goes back to that.
   */
  private endRead(entry: Entry): Settled | null {
    const settled = entry.settled;
    entry.target = "program";
    entry.pending = "";
    entry.version = undefined;
    entry.settled = null;
    return settled;
  }

  /** Turns `justUpdated` on for a while. */
  private markUpdated(id: string): void {
    const entry = this.entry(id);
    if (entry.justUpdatedTimer) clearTimeout(entry.justUpdatedTimer);
    entry.justUpdatedTimer = setTimeout(() => {
      entry.justUpdatedTimer = null;
      this.update(id, { justUpdated: false });
    }, JUST_UPDATED_MS);
    this.update(id, { justUpdated: true });
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

  /** Sets the next poll, if a renderer polls and the last read went well enough to compare against. */
  private schedulePoll(id: string): void {
    const entry = this.entry(id);
    if (entry.pollTimer) clearTimeout(entry.pollTimer);
    entry.pollTimer = null;
    if (!polls(entry)) return;
    const interval = Math.min(...entry.pollers.values());
    // Each failure doubles the wait. Jitter, so renderers opened together don't poll together.
    const wait = interval * 2 ** entry.pollFailures * (0.9 + Math.random() * 0.2);
    entry.pollTimer = setTimeout(() => this.pollNow(id), Math.min(wait, MAX_TIMEOUT_MS));
  }

  private pollNow(id: string): void {
    const entry = this.entry(id);
    entry.pollTimer = null;
    // A read in progress schedules the next poll when it ends.
    if (!polls(entry) || entry.controller) return;
    if (typeof document !== "undefined" && document.hidden) {
      this.dueWhileHidden.add(id);
      document.addEventListener("visibilitychange", this.onVisible);
      return;
    }
    // Gone, so nothing on screen to compare: a full read, which brings it back if it's shared again.
    void this.connect(id, isGone(entry) ? "" : entry.tag);
  }

  /** The tab is back: run the polls that came due while it was hidden. */
  private readonly onVisible = (): void => {
    if (document.hidden) return;
    document.removeEventListener("visibilitychange", this.onVisible);
    const due = [...this.dueWhileHidden];
    this.dueWhileHidden.clear();
    due.forEach((id) => this.pollNow(id));
  };

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
        const { version, tag, is_owner, is_editable } = event.data ?? {};
        // Seen, so an edit's version noted later counts as newer.
        if (version) entry.versions.add(version);
        entry.tag = tag;
        const shown = snapshot.program;
        const newVersion = version !== snapshot.version;
        // A reconnect into the version being streamed sends it whole again.
        const reconnect = version !== undefined && version === entry.version;
        // A new version streams onto the screen as it's generated: an edit sends its prior
        // program first, then its patch, which the parser merges in. What's on screen stays
        // until its first delta replaces it.
        const overShown = shown !== null && newVersion;
        entry.version = version;
        if (!reconnect) {
          // The same version again (a rename, an access change, a re-read) loads out of sight.
          entry.target = shown === null || newVersion ? "program" : "pending";
          entry.pending = "";
          if (overShown) entry.settled ??= { program: shown, version: snapshot.version };
        }
        entry.replace = reconnect || overShown;
        // The stream resends the build's current step after its reference.
        this.update(id, {
          type: event.data?.type ?? snapshot.type,
          title: event.data?.title ?? snapshot.title,
          isOwner: is_owner ?? snapshot.isOwner,
          isEditable: is_editable ?? snapshot.isEditable,
          // A poll that found only a rename or an access change doesn't show as loading.
          isStreaming: snapshot.isStreaming || newVersion,
          step: undefined,
          error: null,
          ...(entry.target === "program" && { version, program: shown ?? "" }),
        });
        return;
      }
      case "unchanged":
        this.afterRead(id);
        return;
      case "delta": {
        const text = event.data?.text;
        if (typeof text !== "string") return;
        const replace = entry.replace;
        entry.replace = false;
        if (entry.target === "pending") entry.pending = (replace ? "" : entry.pending) + text;
        // The first content a build writes ends its step.
        else {
          this.update(id, {
            program: (replace ? "" : (snapshot.program ?? "")) + text,
            step: undefined,
          });
        }
        return;
      }
      case "step": {
        this.update(id, { step: stepOf(event.data) });
        return;
      }
      case "end": {
        const swapped =
          entry.target === "pending" ? { program: entry.pending, version: entry.version } : {};
        const replaced = this.endRead(entry) !== null;
        this.update(id, { ...swapped, isStreaming: false, step: undefined });
        if (replaced) this.markUpdated(id);
        this.catchUp(id);
        this.afterRead(id);
        return;
      }
      case "error": {
        const code = event.data?.code;
        const errorCode =
          code && ERROR_CODES.has(code) ? (code as ArtifactStreamErrorCode) : "generation-failed";
        const gone = errorCode === "not-found";
        // The next renderer to open it reads it again.
        if (gone) entry.started = false;
        this.update(id, {
          ...this.endRead(entry),
          // Deleted or unshared: nothing of it stays on screen.
          ...(gone && { program: null, version: undefined }),
          isStreaming: false,
          step: undefined,
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

/**
 * Tells every renderer showing `id` that `version` was just saved, so they load
 * it now instead of on their next poll.
 *
 * @internal Used by `@openuidev/react-ui/cloud`'s `useArtifactUpdate`.
 */
export function noteArtifactVersion(
  storage: ArtifactStorage,
  id: string,
  version: string | undefined,
): void {
  stores.get(storage)?.noteVersion(id, version);
}

/**
 * Calls `watcher` on every change to any artifact's stream on `storage`, such as
 * a rename, an access change or a `not-found` a poll picked up. Returns a function
 * that stops it.
 *
 * @internal Used by `@openuidev/react-ui/cloud`'s artifact cache.
 */
export function watchArtifactStreams(
  storage: ArtifactStorage,
  watcher: ArtifactStreamWatcher,
): () => void {
  return storeFor(storage).watch(watcher);
}

/** @category Types */
export interface UseArtifactStreamOptions {
  /** The artifact to show. */
  id: string | null | undefined;
  /** The version from the artifact's tool response. A new one fetches the newer revision. */
  version?: string;
  /** The artifact's saved content, when you keep artifacts in your own storage. Never streams. */
  content?: string;
  pollInterval?: number | false;
}

/** @category Types */
export interface ArtifactStreamState extends Omit<ArtifactStreamSnapshot, "id"> {
  /** Reconnects after a `network-error`. Undefined when there's nothing to retry. */
  retry?: () => void;
  /** For a data call refused because the artifact moved on: run the queries again, or show the error. */
  reportVersionMismatch?: (version: string) => Promise<"rerun" | "show">;
}

const IDLE: ArtifactStreamState = {
  program: null,
  isStreaming: false,
  justUpdated: false,
  error: null,
};

/**
 * Streams an artifact in by id from the configured {@link ArtifactStorage},
 * sharing one stream per artifact across every component that shows it.
 *
 * - While it's generated, `program` grows and `isStreaming` is `true`.
 * - After a reload, it replays everything generated so far, then continues.
 * - A new version streams in live: an edit shows its prior program, then its patch
 *   merging in. One that fails goes back to the version before it.
 * - Storages without `stream` are read once with `get`.
 * - With `pollInterval`, it picks up a newer version, a rename or an access
 *   change, and the `not-found` error once the artifact is deleted or unshared.
 *
 * @internal Used by the `@openuidev/react-ui/cloud` renderers.
 */
export function useArtifactStream({
  id,
  version,
  content,
  pollInterval,
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
  useEffect(() => {
    if (!store || !id || !pollInterval) return;
    return store.poll(id, pollInterval);
  }, [store, id, pollInterval]);
  // During render: noteVersion's effect runs after the renderer's queries start.
  const awaiting = store && id ? store.awaits(id, version) : false;
  const reportVersionMismatch = useMemo(
    () => (store && id ? (refused: string) => store.versionMismatch(id, refused) : undefined),
    [store, id],
  );

  return useMemo<ArtifactStreamState>(() => {
    if (ownContent) return { ...IDLE, program: content };
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
    return { ...rest, isStreaming: rest.isStreaming || awaiting, retry, reportVersionMismatch };
  }, [ownContent, content, snapshot, id, storage, store, awaiting, reportVersionMismatch]);
}
