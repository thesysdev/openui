import type { CloudPromptOptions, LibrarySpec } from "@openuidev/lang-core";
import type { McpOption } from "../tools/mcp";
import type { ToolDefinition } from "../tools/types";

export interface OpenUIClientOptions {
  /** Defaults to the `THESYS_API_KEY` environment variable. */
  apiKey?: string;
  /** OpenUI Cloud origin, without /v1. Defaults to https://api.thesys.dev. */
  apiBaseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

/** The components an artifact can use, such as a library from `createLibrary`. */
export interface ArtifactLibrary {
  toSpec(): LibrarySpec;
}

/** A data tool, as you pass it to `openui.createInterpreter`. Only what generation needs is sent, never `execute`. */
export type ArtifactDataTool = Omit<ToolDefinition, "name"> & { execute?: unknown };

/** Extend the prompt built from your library: `examples`, `preamble`, `additionalRules`. */
export type ArtifactPromptOptions = CloudPromptOptions;

interface ArtifactToolOptionsBase {
  library: ArtifactLibrary;
  model: string;
  promptOptions?: ArtifactPromptOptions;
}

/** Your data tools, an MCP server's, or both. Pass the same to `openui.createInterpreter`. */
type LiveDataTools =
  | { tools: Record<string, ArtifactDataTool>; mcp?: McpOption<never> }
  | { tools?: Record<string, ArtifactDataTool>; mcp: McpOption<never> };

export type LiveArtifactToolOptions = ArtifactToolOptionsBase & { kind: "live" } & LiveDataTools;

export interface StaticArtifactToolOptions extends ArtifactToolOptionsBase {
  kind: "static";
  tools?: never;
  mcp?: never;
}

export interface CreateArtifactParams {
  /** The signed-in user, from your session. Users only read and edit their own artifacts. */
  userId: string;
  /** A short title, such as "Q3 sales by region". */
  title: string;
  /** One sentence on what the artifact shows. */
  description?: string;
  /** What to build. The subagent sees only this, so include any data it needs. */
  prompt: string;
}

export interface EditArtifactParams {
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

export type ArtifactToolOptions = LiveArtifactToolOptions | StaticArtifactToolOptions;

/** Creates and edits one kind of artifact. Each call returns as soon as the artifact has an id. */
export interface ArtifactTool {
  readonly kind: ArtifactToolOptions["kind"];
  create(params: CreateArtifactParams, options?: RequestOptions): Promise<ArtifactResult>;
  /** Edits in place. Renderers keep the current version until the edit is ready. */
  edit(params: EditArtifactParams, options?: RequestOptions): Promise<ArtifactResult>;
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
