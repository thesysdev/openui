import type { RequestOptions } from "../../core/resource";
import type { ExecutionContext, Interpreter, InterpreterOptions } from "../../interpreter/types";
import type { ArtifactLibrary, ArtifactPromptOptions, CloudArtifact } from "../types";

export type DashboardOptions<Context extends ExecutionContext = ExecutionContext> = {
  library: ArtifactLibrary;
  /** The model that builds and edits dashboards, as `provider/model`. */
  model: string;
  /** How much the model thinks, for models that can: as OpenAI's `reasoning_effort`. */
  reasoningEffort?: "minimal" | "low" | "medium" | "high";
  /**
   * Tool-call rounds before the model must write the dashboard. Default: 20. With `0` the
   * model calls no tools directly, but its data scripts still call them.
   */
  maxToolRounds?: number;
  promptOptions?: ArtifactPromptOptions;
  /**
   * Your business context: what it does, who reads the dashboards, your terms,
   * calendar and units. The same for every user; sent with every create and edit.
   */
  instructions?: string;
} & InterpreterOptions<Context>;

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

/** JSON Schema that is also a Standard Schema (`~standard` is non-enumerable), so SDKs taking either accept it. */
export type DashboardToolSchema = {
  type: "object";
  properties: Record<string, { type: "string"; description: string }>;
  required: string[];
  additionalProperties: false;
  readonly "~standard": {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (value: unknown) =>
      | { readonly value: Record<string, unknown>; readonly issues?: undefined }
      | {
          readonly issues: ReadonlyArray<{
            readonly message: string;
            readonly path?: ReadonlyArray<PropertyKey>;
          }>;
        };
    readonly types?: {
      readonly input: Record<string, unknown>;
      readonly output: Record<string, unknown>;
    };
    readonly jsonSchema: {
      readonly input: (options: { readonly target: string }) => Record<string, unknown>;
      readonly output: (options: { readonly target: string }) => Record<string, unknown>;
    };
  };
};

/** A dashboard tool for agent frameworks; also an AI SDK tool as is. */
export interface DashboardTool {
  name: string;
  description: string;
  inputSchema: DashboardToolSchema;
  /**
   * Resolves with OpenUI Cloud's response for create and edit (render it as is), or the
   * dashboard as JSON for get. Throws a sentence for the model. `callContext` is the framework's.
   */
  execute(input: Record<string, unknown>, callContext?: unknown): Promise<string>;
}

/** A type, not an interface, so it fits `Record<string, Tool>` parameters such as the AI SDK's `tools`. */
export type DashboardTools = Record<
  "create_dashboard" | "edit_dashboard" | "get_dashboard",
  DashboardTool
>;

/** Auth your middleware already verified, as MCP SDK v2's `AuthInfo`. */
export interface McpAuthInfo {
  token: string;
  clientId: string;
  scopes: string[];
  expiresAt?: number;
  extra?: Record<string, unknown>;
}

/** An MCP SDK v2 `McpServer`. */
export interface DashboardMcpServer {
  connect(transport: unknown): Promise<void>;
  close(): Promise<void>;
}

/** An MCP SDK v2 client transport. */
export interface McpClientTransport {
  start(): Promise<void>;
  send(message: unknown, options?: unknown): Promise<void>;
  close(): Promise<void>;
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: unknown, extra?: unknown) => void;
  sessionId?: string;
  setProtocolVersion?: (version: string) => void;
}

/** Serves one MCP request: `fetch(url, init)` from a client, or `fetch(request, { authInfo })` as a route. */
export type McpFetch = (input: string | URL | Request, init?: object) => Promise<Response>;

/** Finds a request's user. `null` answers 401; a thrown `Response` is sent as is. */
export type McpResolve<Context extends ExecutionContext = ExecutionContext> = (
  request: Request,
  authInfo?: McpAuthInfo,
) => Context | null | Promise<Context | null>;

export interface DashboardMcpHandler {
  /** For MCP clients in this process; never contacted. */
  url: string;
  /** Serve it as a route, or pass it to an MCP client in this process. */
  fetch: McpFetch;
  /** A new client transport over `fetch`, one per client. */
  transport(): Promise<McpClientTransport>;
  /** Stops builds in flight. */
  close(): Promise<void>;
}

/**
 * Creates and edits live dashboards. A call runs the tool rounds (typically 20-45 s), then,
 * once generation starts, resolves with the tool response: return it from your tool as is and
 * pass it to the renderer. Later failures aren't reported. `{ stream: true }` yields a message
 * once the dashboard has an id, and a last one once it's saved or failed: return that one.
 */
export interface Dashboard<Context extends ExecutionContext = ExecutionContext> {
  /** The dashboard is `context.userId`'s: until shared, only they can open, edit and run it. */
  create(
    params: CreateDashboardParams,
    context: Context,
    options: RequestOptions & { stream: true },
  ): AsyncIterable<string>;
  create(
    params: CreateDashboardParams,
    context: Context,
    options?: RequestOptions & { stream?: false },
  ): Promise<string>;
  /**
   * Edits in place, for its owner or anyone it's shared with for editing.
   * Renderers keep the current version until the edit is ready.
   */
  edit(
    params: EditDashboardParams,
    context: Context,
    options: RequestOptions & { stream: true },
  ): AsyncIterable<string>;
  edit(
    params: EditDashboardParams,
    context: Context,
    options?: RequestOptions & { stream?: false },
  ): Promise<string>;
  /**
   * Reads a dashboard the user can open, own or shared. Give the model its `name` and
   * `content`, or the renderer its `id`.
   */
  get(
    params: GetDashboardParams,
    context: Context,
    options?: RequestOptions,
  ): Promise<CloudArtifact>;
  /** Runs this dashboard's data tools and generated scripts on your server. */
  readonly interpreter: Interpreter<Context>;
  /** The tools for agent frameworks, as `context`'s user, or a function finding the user per call. */
  tools(
    context: Context | ((callContext: unknown) => Context | Promise<Context>),
  ): Promise<DashboardTools>;
  /** The tools as an MCP server for one user. Needs `@modelcontextprotocol/server`. */
  mcpServer(context: Context): Promise<DashboardMcpServer>;
  /**
   * The tools over Streamable HTTP, for a fixed user or one `resolve` finds per request. Needs
   * `@modelcontextprotocol/server`, and `@modelcontextprotocol/client` for `transport()`.
   */
  mcpHandler(context: Context | McpResolve<Context>): DashboardMcpHandler;
}
