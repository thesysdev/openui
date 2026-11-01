import type { McpServers } from "./mcp";

/** Provider-neutral metadata passed to generation, without server handlers. */
export interface ToolDefinition {
  name: string;
  description?: string;
  parameters: Record<string, unknown>;
  /** Illustrative output for generation; the handler supplies actual runtime data. */
  output?: unknown;
}

/**
 * Runs a data tool on your server. `context` is whatever you pass to
 * `interpreter.execute`, untouched, such as the signed-in user.
 */
export type ToolHandler<Context = undefined> = (
  context: Context,
  args: Record<string, unknown>,
  options: { signal: AbortSignal },
) => unknown | Promise<unknown>;

/** A data tool: what generation sees, plus the handler that runs it. */
export type DataTool<Context = undefined> = Omit<ToolDefinition, "name"> & {
  execute: ToolHandler<Context>;
};

/** What the renderer sends your interpreter for each data tool call. */
export interface InterpreterRequest {
  /** The query or tool to run. */
  name: string;
  arguments?: Record<string, unknown>;
  /** The artifact the call is for. Generated scripts run from its stored content. */
  id?: string;
}

export interface InterpreterExecuteOptions {
  signal?: AbortSignal;
  /** Total execution budget, including your tools. Default: 60 seconds. */
  timeoutMs?: number;
}

/** A dashboard's data tools: yours, an MCP server's, or both. */
export type InterpreterOptions<Context = undefined> =
  | { tools: Record<string, DataTool<Context>>; mcp?: McpServers<Context> }
  | { tools?: Record<string, DataTool<Context>>; mcp: McpServers<Context> };

export interface Interpreter<Context = undefined> {
  /** `context` reaches your tools as is, such as the signed-in user. */
  execute(
    request: InterpreterRequest,
    ...rest: undefined extends Context
      ? [context?: Context, options?: InterpreterExecuteOptions]
      : [context: Context, options?: InterpreterExecuteOptions]
  ): Promise<unknown>;
}

export interface ScriptToolCall {
  type?: "function_call";
  call_id: string;
  name: string;
  arguments: string;
}

export type ScriptToolResult =
  | { type: "function_call_output"; call_id: string; output: string }
  | { call_id: string; error: { code: string; message: string } };

/** Execution failures expose a stable code and an optional HTTP status. */
export class ToolExecutionError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ToolExecutionError";
  }
}
