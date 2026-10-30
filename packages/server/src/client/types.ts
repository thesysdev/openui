import type { CloudPromptOptions, LibrarySpec } from "@openuidev/lang-core";
import type { McpOption } from "../tools/mcp";
import type { DataTool, Interpreter } from "../tools/types";

export interface OpenUIClientOptions {
  /** Defaults to the `THESYS_API_KEY` environment variable. */
  apiKey?: string;
  /** OpenUI Cloud origin, without /v1. Defaults to https://api.thesys.dev. */
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

/** The components an artifact can use, such as a library from `createLibrary`. */
export interface ArtifactLibrary {
  toSpec(): LibrarySpec;
}

/** Extend the prompt built from your library: `examples`, `preamble`, `additionalRules`. */
export type ArtifactPromptOptions = CloudPromptOptions;

/** Your data tools, an MCP server's, or both. The dashboard's interpreter runs them. */
type DashboardDataTools<Context> =
  | { tools: Record<string, DataTool<Context>>; mcp?: McpOption<Context> }
  | { tools?: Record<string, DataTool<Context>>; mcp: McpOption<Context> };

export type DashboardOptions<Context = undefined> = {
  /**
   * Your name for this dashboard, such as "sales": 1 to 64 letters, digits,
   * `_` or `-`, and different for every dashboard you define. Its artifacts
   * remember it, so `openui.interpreter` runs their data tools with this one.
   */
  name: string;
  library: ArtifactLibrary;
  /** The model that builds and edits dashboards, as `provider/model`. */
  model: string;
  promptOptions?: ArtifactPromptOptions;
} & DashboardDataTools<Context>;

export interface CreateDashboardParams {
  /** The signed-in user, from your session. Users only read and edit their own artifacts. */
  userId: string;
  /** A short title, such as "Q3 sales by region". */
  title: string;
  /** One sentence on what the artifact shows. */
  description?: string;
  /** What to build. The subagent sees only this, so include any data it needs. */
  prompt: string;
}

export interface EditDashboardParams {
  id: string;
  userId: string;
  /** The change to make, and any data it needs. */
  prompt: string;
}

/** How to make a call, apart from what it asks for. */
export interface RequestOptions {
  /** Cancels the call while it waits for OpenUI Cloud. */
  signal?: AbortSignal;
}

export interface ArtifactResult {
  id: string;
  /** Return this from your tool as is, and pass the same string to the renderer. */
  response: string;
}

/** Creates and edits live dashboards. Each call returns as soon as the artifact has an id. */
export interface Dashboard<Context = undefined> {
  readonly name: string;
  create(params: CreateDashboardParams, options?: RequestOptions): Promise<ArtifactResult>;
  /** Edits in place. Renderers keep the current version until the edit is ready. */
  edit(params: EditDashboardParams, options?: RequestOptions): Promise<ArtifactResult>;
  /** Runs this dashboard's data tools and generated scripts on your server. */
  readonly interpreter: Interpreter<Context>;
}

export interface CreateFrontendTokenParams {
  /** The signed-in user, from your session. The token reads only their artifacts. */
  userId: string;
}

/** A user's frontend token, in the shape the browser's `createFrontendTokenManager` reads. */
export interface FrontendToken {
  /** `fct_…`, for the `x-thesys-frontend-token` header. */
  token: string;
  /** When it expires, in unix seconds. */
  expires_at: number;
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
