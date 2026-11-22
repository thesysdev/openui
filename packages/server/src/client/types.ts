import type { CloudPromptOptions, LibrarySpec } from "@openuidev/lang-core";
import type { McpServers } from "../tools/mcp";
import type { DataTool, ExecutionContext, Interpreter } from "../tools/types";

export interface OpenUIClientOptions {
  /** Defaults to the `THESYS_API_KEY` environment variable. */
  apiKey?: string;
  /** OpenUI Cloud origin, without /v1. Defaults to https://api.thesys.dev. */
  baseUrl?: string;
  /**
   * Your app, when one API key serves several: users' frontend tokens and
   * artifacts belong to it, and generated scripts run only from it.
   */
  appId?: string;
  fetch?: typeof globalThis.fetch;
}

/**
 * The components an artifact can use, as a library spec: `library.toSpec()`, or
 * the JSON from `openui generate --spec`.
 */
export type ArtifactLibrary = LibrarySpec;

/** Extend the prompt built from your library: `examples`, `preamble`, `additionalRules`. */
export type ArtifactPromptOptions = CloudPromptOptions;

/** Your data tools, an MCP server's, or both. The dashboard's interpreter runs them. */
type DashboardDataTools<Context extends ExecutionContext> =
  | { tools: Record<string, DataTool<Context>>; mcp?: McpServers<Context> }
  | { tools?: Record<string, DataTool<Context>>; mcp: McpServers<Context> };

export type DashboardOptions<Context extends ExecutionContext = ExecutionContext> = {
  library: ArtifactLibrary;
  /** The model that builds and edits dashboards, as `provider/model`. */
  model: string;
  promptOptions?: ArtifactPromptOptions;
} & DashboardDataTools<Context>;

export interface CreateDashboardParams {
  /** A short title, such as "Q3 sales by region". */
  title: string;
  /** What to build. The subagent sees only this, so include any data it needs. */
  prompt: string;
}

export interface EditDashboardParams {
  id: string;
  /** The change to make, and any data it needs. */
  prompt: string;
}

export interface GetDashboardParams {
  id: string;
}

/** How to make a call, apart from what it asks for. */
export interface RequestOptions {
  /** Cancels the call while it waits for OpenUI Cloud. */
  signal?: AbortSignal;
}

/**
 * Creates and edits live dashboards. Each call resolves, as soon as the artifact has an id,
 * with the tool's response: return it from your tool as is, and pass it to the renderer.
 */
export interface Dashboard<Context extends ExecutionContext = ExecutionContext> {
  /**
   * `context` says who's asking, as for the interpreter: the dashboard belongs
   * to `context.userId`. Until they share it, only they can read, edit and run it.
   */
  create(
    params: CreateDashboardParams,
    context: Context,
    options?: RequestOptions,
  ): Promise<string>;
  /**
   * Edits in place, for its owner or anyone it's shared with for editing, through
   * `context.userId` or `context.groupIds`. Renderers keep the current version until the edit is ready.
   */
  edit(params: EditDashboardParams, context: Context, options?: RequestOptions): Promise<string>;
  /**
   * Reads a dashboard the user can open: their own, or one shared with them through
   * `context.userId` or `context.groupIds`. Give the model its `name` and `content`, or the
   * renderer its `id`.
   */
  get(
    params: GetDashboardParams,
    context: Context,
    options?: RequestOptions,
  ): Promise<CloudArtifact>;
  /** Runs this dashboard's data tools and generated scripts on your server. */
  readonly interpreter: Interpreter<Context>;
}

export interface CreateFrontendTokenParams {
  /** The signed-in user, from your session. The token reads their artifacts and those shared with them. */
  userId: string;
  /**
   * The groups the user is in, from your own system: artifacts shared with any of them are
   * readable too. Up to 10, each up to 64 characters. The token carries them until it expires,
   * so a change shows on the next token.
   */
  groupIds?: string[];
}

/** A user's frontend token, in the shape the browser's `createFrontendTokenManager` reads. */
export interface FrontendToken {
  /** `fct_…`, for the `x-thesys-frontend-token` header. */
  token: string;
  /** When it expires, in unix seconds. */
  expires_at: number;
}

/**
 * Who an artifact call is for. Without `userId` it's your org, which sees every
 * user's artifacts. With it, the call acts as that user and gets what their
 * frontend token would.
 */
export interface ArtifactRequestOptions extends RequestOptions {
  /** The user to act as, from your session. Never take it from the browser. */
  userId?: string;
  /**
   * That user's groups, as on their frontend token, so artifacts shared with
   * those groups count too. Only with `userId`. Up to 10, each up to 64 characters.
   */
  groupIds?: string[];
}

/** Pins belong to a user, so pinning needs one. */
export type ArtifactUserOptions = ArtifactRequestOptions & { userId: string };

/** Who an artifact is shared with: one user, or one of your groups. */
export interface ArtifactShareTarget {
  type: "user" | "group";
  id: string;
}

/** `view` opens and runs it; `edit` also edits, renames and shares it. */
export interface ShareArtifactParams extends ArtifactShareTarget {
  access: "view" | "edit";
}

/** One share on an artifact. */
export interface CloudArtifactShare extends ShareArtifactParams {
  /** Who shared it: a user id, or your org id for the API key alone. */
  createdBy: string;
  /** Unix milliseconds. */
  createdAt: number;
}

/** A saved artifact. Dashboards hold only their layout: scripts stay in OpenUI Cloud. */
export interface CloudArtifact {
  id: string;
  kind: "dashboard" | "slides" | "report";
  name?: string;
  /** The openui-lang program, ready for the renderer. */
  content: string;
  version?: string;
  /** Whether the user pinned it. Always false for your org, which has no pins. */
  pinned: boolean;
  /** Whether the user made it. Always false for your org. */
  isOwner: boolean;
  /** Whether the caller can edit, rename and share it. Always true for your org. */
  isEditable: boolean;
  /** Who it's shared with. Only when `isEditable`. */
  shares?: CloudArtifactShare[];
  conversationId?: string;
  /** The user it was made for. Absent when your org made it without one. */
  userId?: string;
  /** That user's app. */
  appId?: string;
  /** Unix milliseconds. */
  createdAt: number;
  /** Unix milliseconds. */
  updatedAt?: number;
}

/** One page of artifacts, newest first unless you ask for `order: "asc"`. */
export interface CloudArtifactList {
  data: CloudArtifact[];
  hasMore: boolean;
  firstId?: string;
  /** Pass as `after` for the next page. */
  lastId?: string;
}

export interface ListArtifactsParams extends ArtifactRequestOptions {
  /** Only these kinds. */
  kind?: CloudArtifact["kind"] | CloudArtifact["kind"][];
  /** Case-insensitive match on the name. */
  name?: string;
  /** `true` for pinned artifacts only, `false` for unpinned ones. */
  pinned?: boolean;
  /** `true` for the user's own artifacts only, `false` for those shared with them. Needs `userId`. */
  isOwner?: boolean;
  /** Only the artifacts made in this conversation. */
  conversationId?: string;
  /** Page size, 1 to 100. */
  limit?: number;
  /** The page after this id: the last page's `lastId`. */
  after?: string;
  /** The page before this id: the last page's `firstId`. */
  before?: string;
  order?: "asc" | "desc";
}

export interface UpdateArtifactParams {
  /** The new name. */
  name?: string;
  /** The edited openui-lang program. Omit it to rename only. */
  content?: string;
}

/** Read and manage saved artifacts with the API key. */
export interface Artifacts {
  list(params?: ListArtifactsParams): Promise<CloudArtifactList>;
  get(id: string, options?: ArtifactRequestOptions): Promise<CloudArtifact>;
  update(
    id: string,
    params: UpdateArtifactParams,
    options?: ArtifactRequestOptions,
  ): Promise<CloudArtifact>;
  /** Deleted artifacts can't be restored. */
  delete(id: string, options?: ArtifactRequestOptions): Promise<void>;
  pin(id: string, options: ArtifactUserOptions): Promise<CloudArtifact>;
  unpin(id: string, options: ArtifactUserOptions): Promise<CloudArtifact>;
  /** Shares it, or changes the access of a target it's already shared with. */
  share(
    id: string,
    params: ShareArtifactParams,
    options?: ArtifactRequestOptions,
  ): Promise<CloudArtifact>;
  /** Removing a share that isn't there does nothing. */
  unshare(
    id: string,
    target: ArtifactShareTarget,
    options?: ArtifactRequestOptions,
  ): Promise<CloudArtifact>;
}

/** Failures from the OpenUI Cloud API expose a stable code and the HTTP status. */
export class OpenUIApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "OpenUIApiError";
  }
}
