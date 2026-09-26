/** A JSON Schema property accepted by a dashboard tool. */
export interface DashboardParameterSchema {
  type?: string;
  description?: string;
  enum?: unknown[];
  properties?: Record<string, DashboardParameterSchema>;
  items?: DashboardParameterSchema;
  required?: string[];
  [key: string]: unknown;
}

/** JSON Schema for a dashboard tool's object parameters. */
export interface DashboardToolParameters {
  type: "object";
  properties?: Record<string, DashboardParameterSchema>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: unknown;
}

/** Function tool in the flat Responses API shape. */
export interface ResponsesFunctionTool {
  type: "function";
  name: string;
  description?: string;
  parameters?: DashboardToolParameters | null;
  strict?: boolean | null;
}

/** The equivalent Chat Completions function-tool shape. */
export interface ChatCompletionFunctionTool {
  type: "function";
  function: Omit<ResponsesFunctionTool, "type">;
}

/** A customer-owned dashboard data tool. `context` is trusted route state. */
export interface DashboardToolDef<Ctx = undefined> extends ResponsesFunctionTool {
  /** Must be a valid identifier because generated scripts call `tools.<name>(...)`. */
  name: string;
  /** Representative output used while generating dashboard bindings and defaults. */
  sample?: unknown;
  execute: (args: Record<string, unknown>, context: Ctx) => Promise<unknown> | unknown;
}

export interface DashboardScriptsOptions {
  /** OpenUI Cloud API key. Default: `process.env.THESYS_API_KEY`. */
  apiKey?: string;
  /** OpenUI Cloud API origin. Default: `https://api.thesys.dev`. */
  baseUrl?: string;
  /** Per-round timeout in milliseconds. Default: 30 seconds. */
  timeoutMs?: number;
  /** Default: enabled when an API key is available. */
  enabled?: boolean;
  /** Override fetch for tests or custom transports. */
  fetch?: typeof fetch;
}

/** The serializable portion of a dashboard data tool used during generation. */
export type DashboardGenerationTool = Omit<DashboardToolDef, "execute">;

export interface CreateDashboardToolsOptions<Ctx = undefined> {
  tools: DashboardToolDef<Ctx>[];
  scripts?: DashboardScriptsOptions;
}

/** Artifact identity supplied by the renderer when it executes a stored script. */
export interface DashboardArtifactRef {
  id: string;
  version?: string;
}

/** One renderer-originated dashboard Query or Mutation request. */
export interface DashboardQueryRequest {
  name: string;
  arguments?: Record<string, unknown>;
  artifact?: DashboardArtifactRef;
}

/** Makes the route context optional only when the supplied context type allows it. */
export type ContextArg<Ctx> = undefined extends Ctx ? [context?: Ctx] : [context: Ctx];

/** Ready for `Response.json(result.body, { status: result.status })`. */
export type DashboardRunResult =
  | { ok: true; status: 200; body: { result: unknown } }
  | { ok: false; status: number; body: { error: { code: string; message: string } } };

export type DashboardToolErrorCode =
  "TOOL_NOT_FOUND" | "BAD_ARGS" | "TOOL_EXEC_ERROR" | "BAD_REQUEST";

/** Internal dispatch failure shared by the local tool runner and script loop. */
export class DashboardToolError extends Error {
  readonly code: DashboardToolErrorCode;
  readonly status: number;

  constructor(code: DashboardToolErrorCode, message: string, status: number) {
    super(message);
    this.name = "DashboardToolError";
    this.code = code;
    this.status = status;
  }
}
