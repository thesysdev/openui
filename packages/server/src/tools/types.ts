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
/**
 * Who a call is for: the signed-in user, from your session. Add anything else
 * your tools need; they get the whole object.
 */
export interface ExecutionContext {
  userId: string;
}

/** Every call needs `context.userId`. The types require it; this catches callers they don't check. */
export function assertUserIdRequired(context: unknown): asserts context is ExecutionContext {
  const userId = (context as { userId?: unknown } | undefined)?.userId;
  if (typeof userId !== "string" || !userId.trim()) {
    throw new ToolExecutionError(
      "context.userId is required: the signed-in user, from your session",
      "invalid_input",
      400,
    );
  }
}

export type ToolHandler<Context extends ExecutionContext = ExecutionContext> = (
  args: Record<string, unknown>,
  context: Context,
  options: { signal: AbortSignal },
) => unknown | Promise<unknown>;

/** A data tool: what generation sees, plus the handler that runs it. */
export type DataTool<Context extends ExecutionContext = ExecutionContext> = Omit<
  ToolDefinition,
  "name"
> & {
  execute: ToolHandler<Context>;
};

/** What the renderer sends your interpreter for each data tool call. */
export interface InterpreterRequest {
  /** The query or tool to run. */
  name: string;
  arguments?: Record<string, unknown>;
  /** The artifact the call is for. Generated scripts run from its stored content. */
  id?: string;
  /** The version the renderer shows. A script run against an older one is refused (409). */
  version?: string;
}

export interface InterpreterExecuteOptions {
  signal?: AbortSignal;
  /** Total execution budget, including your tools. Default: 60 seconds. */
  timeoutMs?: number;
}

/** A dashboard's data tools: yours, an MCP server's, or both. */
export type InterpreterOptions<Context extends ExecutionContext = ExecutionContext> =
  | { tools: Record<string, DataTool<Context>>; mcp?: McpServers<Context> }
  | { tools?: Record<string, DataTool<Context>>; mcp: McpServers<Context> };

export interface Interpreter<Context extends ExecutionContext = ExecutionContext> {
  /**
   * `context` reaches your tools as is. Generated scripts run only for the
   * user who owns the artifact, `context.userId`.
   */
  execute(
    request: InterpreterRequest,
    context: Context,
    options?: InterpreterExecuteOptions,
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
