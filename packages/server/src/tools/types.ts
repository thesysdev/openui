/** Provider-neutral metadata passed to generation, without server handlers. */
export interface ToolDefinition {
  name: string;
  description?: string;
  parameters: Record<string, unknown>;
  /** Illustrative output for generation; the handler supplies actual runtime data. */
  output?: unknown;
}

/** Registered customer tools execute on the host server with trusted context. */
export type ToolExecutor<Context = undefined> = (
  args: Record<string, unknown>,
  options: { context: Context; signal: AbortSignal },
) => unknown | Promise<unknown>;

export type ToolRegistration<Context = undefined> = Omit<ToolDefinition, "name"> & {
  execute: ToolExecutor<Context>;
};

export interface ToolExecutionRequest {
  name: string;
  arguments?: Record<string, unknown>;
  /** Complete generated response. Required for script names, optional for direct tools. */
  response?: string;
}

export type ToolExecutionOptions<Context = undefined> = {
  signal?: AbortSignal;
  /** Total execution budget, including customer tools. Default: 60 seconds. */
  timeoutMs?: number;
} & (undefined extends Context ? { context?: Context } : { context: Context });

export type ExecuteToolInput<Context = undefined> = ToolExecutionRequest &
  ToolExecutionOptions<Context> & {
    tools: Record<string, ToolExecutor<Context>>;
  };

export interface RegisteredTools<Context = undefined> {
  definitions: ToolDefinition[];
  execute(
    input: ToolExecutionRequest,
    ...options: undefined extends Context
      ? [options?: ToolExecutionOptions<Context>]
      : [options: ToolExecutionOptions<Context>]
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
