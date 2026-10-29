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

export type InterpreterExecuteOptions<Context = undefined> = {
  signal?: AbortSignal;
  /** Total execution budget, including your tools. Default: 60 seconds. */
  timeoutMs?: number;
} & (undefined extends Context ? { context?: Context } : { context: Context });

export interface InterpreterOptions<Context = undefined> {
  tools: Record<string, DataTool<Context>>;
}

export interface Interpreter<Context = undefined> {
  definitions: ToolDefinition[];
  execute(
    request: InterpreterRequest,
    ...options: undefined extends Context
      ? [options?: InterpreterExecuteOptions<Context>]
      : [options: InterpreterExecuteOptions<Context>]
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
