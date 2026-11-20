import type { ReactNode } from "react";
import type { Thread } from "../store/types";
import type { Message, UserMessage } from "../types/message";
import type { StreamProtocolAdapter } from "../types/stream";

// ── Storage adapter interfaces ──

export interface ThreadStorage {
  listThreads(cursor?: string): Promise<{ threads: Thread[]; nextCursor?: string }>;
  createThread(firstMessage: UserMessage): Promise<Thread>;
  getMessages(threadId: string): Promise<Message[]>;
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
  /** Whether the user pinned it. Each user has their own pins. */
  pinned?: boolean;
  /** Whether the user created it. Only its owner can delete it. */
  isOwner?: boolean;
  /** Whether the user can edit, rename, and share it: its owner, or anyone it's shared with to edit. */
  isEditable?: boolean;
  /** Who it's shared with. Only for users who can edit it. */
  shares?: ArtifactShare[];
  /** The saved content's version. Every content edit makes a new one. */
  version?: string;
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
  /** `true`: only the user's own artifacts; `false`: only those shared with them. Server-side. */
  isOwner?: boolean;
  /** Newest first (`desc`, the default) or oldest first. */
  order?: "asc" | "desc";
  cursor?: string;
  limit?: number;
}

/** What a share allows: `view` opens and runs the artifact; `edit` also edits, renames, and shares it. */
export type ArtifactAccess = "view" | "edit";

/**
 * Who an artifact is shared with: one user, or one of your groups (the `groupIds` on the user's
 * frontend token).
 */
export interface ArtifactShareTarget {
  type: "user" | "group";
  id: string;
}

/** One share on an artifact. */
export interface ArtifactShare extends ArtifactShareTarget {
  access: ArtifactAccess;
  /** The user who shared it. */
  createdBy: string;
  /** When it was shared, in ms. */
  createdAt: number;
}

/**
 * One event on an artifact's stream: its reference first, then its content in
 * pieces, then `end` (or `error`). Every connection starts over: the
 * reference, then everything so far. A reference with the `version` a reader
 * already has replaces what it has of it. `unchanged` is the whole answer to a
 * `fetchLatest` read when nothing changed.
 */
export type ArtifactStreamEvent =
  | {
      type: "reference";
      data: {
        id: string;
        type?: string;
        title?: string;
        version?: string;
        /** Changes whenever the version, the title, or the user's access does. */
        tag?: string;
        is_owner?: boolean;
        is_editable?: boolean;
      };
    }
  | { type: "delta"; data: { text: string } }
  | { type: "end" }
  | { type: "error"; data: { code?: string; message?: string } }
  | { type: "unchanged" };

export interface ArtifactStreamOptions {
  signal?: AbortSignal;
  /** The `tag` of the last reference read: when it still matches, the stream is just `unchanged`. */
  fetchLatest?: string;
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
  /** Optional. The query results last saved for an artifact, by key. */
  getQueryResults?(id: string): Promise<Record<string, unknown>>;
  /** Optional. Save one query result of an artifact under its key, without waiting. */
  putQueryResult?(id: string, entry: { key: string; value: unknown }): void;
  /** Optional. Share an artifact, or change an existing share's access. Needs edit access. */
  share?(
    id: string,
    share: ArtifactShareTarget & { access: ArtifactAccess },
  ): Promise<ArtifactSummary>;
  /** Optional. Remove a share; removing one that isn't there does nothing. Needs edit access. */
  unshare?(id: string, target: ArtifactShareTarget): Promise<ArtifactSummary>;
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
