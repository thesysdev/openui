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
  /** How much the model thinks, for models that can: as OpenAI's `reasoning_effort`. */
  reasoningEffort?: "minimal" | "low" | "medium" | "high";
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

/** How to make a call, apart from what it asks for. */
export interface RequestOptions {
  /** Cancels the call while it waits for OpenUI Cloud. */
  signal?: AbortSignal;
}

/**
 * One step of a dashboard build: a data tool the model called, a script it saved and ran,
 * or the dashboard starting to generate (render it from then on).
 */
export type DashboardProgress =
  | { type: "tool"; name: string; status: "running" | "done" | "error" }
  | { type: "script"; name: string; status: "running" | "done" | "error" }
  | { type: "started"; artifactId: string };

/** A short line for a progress step, such as "Checking script revenue_by_month". */
export function describeDashboardProgress(step: DashboardProgress): string {
  if (step.type === "started") return "Building the dashboard";
  const what = step.type === "script" ? `script ${step.name}` : step.name;
  if (step.status === "error") return `${what} failed`;
  if (step.type === "script")
    return step.status === "running" ? `Checking ${what}` : `Checked ${what}`;
  return step.status === "running" ? `Calling ${what}` : `Called ${what}`;
}

export interface DashboardRequestOptions extends RequestOptions {
  /**
   * Called as the build goes, to show its progress, for example in your tool's card:
   * forward each step to the browser and label it with `describeDashboardProgress`.
   */
  onProgress?: (step: DashboardProgress) => void;
}

/**
 * Creates and edits live dashboards. Each call resolves, as soon as the artifact has an id,
 * with the tool's response: return it from your tool as is, and pass it to the renderer.
 */
export interface Dashboard<Context extends ExecutionContext = ExecutionContext> {
  /**
   * `context` says who's asking, as for the interpreter: the dashboard belongs
   * to `context.userId`, who alone can read, edit and run it.
   */
  create(
    params: CreateDashboardParams,
    context: Context,
    options?: DashboardRequestOptions,
  ): Promise<string>;
  /** Edits in place, for its owner. Renderers keep the current version until the edit is ready. */
  edit(
    params: EditDashboardParams,
    context: Context,
    options?: DashboardRequestOptions,
  ): Promise<string>;
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
