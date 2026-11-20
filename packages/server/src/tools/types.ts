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
  /**
   * The groups the user is in, from your own system: dashboards shared with any of them are
   * theirs to open. Pass the same value everywhere you pass `userId`. Up to 10, each up to 64
   * characters.
   */
  groupIds?: string[];
}

/**
 * Every call needs `context.userId`, and `groupIds`, when set, must be ids. The types require
 * both; this catches callers they don't check.
 */
export function assertUserIdRequired(context: unknown): asserts context is ExecutionContext {
  const { userId, groupIds } = (context ?? {}) as { userId?: unknown; groupIds?: unknown };
  if (typeof userId !== "string" || !userId.trim()) {
    throw new ToolExecutionError(
      "context.userId is required: the signed-in user, from your session",
      "invalid_input",
      400,
    );
  }
  if (groupIds !== undefined && !isIdList(groupIds)) {
    throw new ToolExecutionError(
      "context.groupIds must be an array of non-empty strings",
      "invalid_input",
      400,
    );
  }
}

/** An array of non-empty strings, such as `groupIds`. */
export function isIdList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((id) => typeof id === "string" && id.trim() !== "");
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
   * `context` reaches your tools as is. Generated scripts run only for users
   * who can open the artifact: its owner, or anyone it's shared with through
   * `context.userId` or `context.groupIds`.
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
