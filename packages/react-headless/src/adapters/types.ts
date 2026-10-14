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
  updateMessage?(threadId: string, message: Message): Promise<void>;
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
}

/** Full artifact. `content` must have the same shape as the tool-call `response` the renderer's parser expects. */
export interface Artifact extends ArtifactSummary {
  content: unknown;
}

export interface ArtifactListParams {
  /** Partial-match search on `title`. Server-side. */
  name?: string;
  /** Filter by artifact types. Server-side. */
  type?: string[];
  cursor?: string;
  limit?: number;
}

export interface ArtifactStorage {
  list(params?: ArtifactListParams): Promise<{ artifacts: ArtifactSummary[]; nextCursor?: string }>;
  get(id: string): Promise<Artifact>;
  /** Persist edited artifact content. Called by renderer implementations (via `useArtifactStorage`), not by the framework. */
  update(patch: { id: string; content: unknown }): Promise<ArtifactSummary>;
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
