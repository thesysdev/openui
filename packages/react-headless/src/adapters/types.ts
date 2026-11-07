import type { ReactNode } from "react";
import type { Thread } from "../store/types";
import type { Message, UserMessage } from "../types/message";
import type { StreamProtocolAdapter } from "../types/stream";

// ── Storage adapter interfaces ──

export interface ThreadStorage {
  listThreads(cursor?: string): Promise<{ threads: Thread[]; nextCursor?: string }>;
  createThread(firstMessage: UserMessage): Promise<Thread>;
  getMessages(threadId: string): Promise<Message[]>;
  /** Optional — cache current messages for a thread. Not all storages support it. */
  cacheMessages?(threadId: string, messages: Message[]): Promise<void>;
  updateThread(thread: Thread): Promise<Thread>;
  deleteThread(id: string): Promise<void>;
}

// ── Artifact storage (global, cross-thread) ──

/** Listing-level artifact record. `content` is fetched separately via `get`. */
export interface ArtifactSummary {
  id: string;
  title: string;
  /** Artifact type, e.g. `'th_dashboard'`, `'th_presentation'`. Matched against renderer `type` and category filters. */
  type: string;
  /** Thread the artifact was created in. Drives the "go to original thread" action. */
  threadId: string;
  updatedAt?: string | number;
  /** Whether the user pinned it. */
  pinned?: boolean;
}

/** Full artifact. `content` must have the same shape as the tool-call `response` the renderer's parser expects. */
export interface Artifact extends ArtifactSummary {
  content: unknown;
}

export interface ArtifactListParams {
  /** Partial-match search on `title`. Server-side. */
  name?: string;
  /** Filter by artifact types (kinds, such as `dashboard` or `slides`). Server-side. */
  type?: string[];
  /** `true`: only pinned artifacts; `false`: only unpinned ones. Server-side. */
  pinned?: boolean;
  /** Newest first (`desc`, the default) or oldest first. */
  order?: "asc" | "desc";
  cursor?: string;
  limit?: number;
}

/**
 * One event on an artifact's stream: its reference first, then its content in
 * pieces, then `end` (or `error`). Every connection starts over: the
 * reference, then everything so far. A reference with the `version` a reader
 * already has replaces what it has of it.
 */
export type ArtifactStreamEvent =
  | {
      type: "reference";
      data: { id: string; type?: string; title?: string; version?: string };
    }
  | { type: "delta"; data: { text: string } }
  | { type: "end" }
  | { type: "error"; data: { code?: string; message?: string } };

export interface ArtifactStreamOptions {
  signal?: AbortSignal;
}

export interface ArtifactStorage {
  list(params?: ArtifactListParams): Promise<{ artifacts: ArtifactSummary[]; nextCursor?: string }>;
  get(id: string): Promise<Artifact>;
  /**
   * Persist edited content, a new title, or both. Called by renderer implementations (via
   * `useArtifactStorage`) and `useArtifactUpdate`, not by the framework. A storage that
   * doesn't rename can ignore `title`.
   */
  update(patch: { id: string; content?: unknown; title?: string }): Promise<ArtifactSummary>;
  /**
   * Optional. Stream an artifact while it is generated, or replay a finished
   * one. A missing artifact yields one `error` event with code `not-found`,
   * and one the caller may not read, code `unauthorized`; a failed
   * connection throws and is retried. Storages without it are read with `get`.
   */
  stream?(id: string, options?: ArtifactStreamOptions): AsyncIterable<ArtifactStreamEvent>;
  /** Optional. Pin an artifact for the user. */
  pin?(id: string): Promise<ArtifactSummary>;
  /** Optional. Unpin an artifact. */
  unpin?(id: string): Promise<ArtifactSummary>;
  /** Optional. Delete an artifact. */
  delete?(id: string): Promise<void>;
}

/**
 * Global artifact category. Categories split the sidebar "Artifacts" nav and
 * the per-thread Workspace sections, and pre-apply filters in the artifact browser.
 */
export interface ArtifactCategory {
  /** Display label + key, e.g. `'Apps'`. */
  name: string;
  filter: {
    /** Artifact types belonging to this category. */
    type: string[];
  };
  /**
   * Icon for this category's sidebar nav item. A platform-neutral node (a web
   * element or a React Native element). When omitted, the nav falls back to the
   * `<ArtifactNav icon>` prop, then a generic default.
   */
  icon?: ReactNode;
}

export interface ChatStorage {
  thread: ThreadStorage;
  /** Optional global artifact storage. Absent → the Artifacts nav and browser are unavailable. */
  artifact?: ArtifactStorage;
  // search, ... — added as features land
}

// ── LLM adapter interface ──

export interface ChatLLM {
  send(params: { threadId: string; messages: Message[]; signal: AbortSignal }): Promise<Response>;
  streamProtocol: StreamProtocolAdapter;
}

// Re-exports kept here so adapter consumers can import everything in one shot.
export type { Thread } from "../store/types";
export type { Message, UserMessage } from "../types/message";
export type { StreamProtocolAdapter } from "../types/stream";
