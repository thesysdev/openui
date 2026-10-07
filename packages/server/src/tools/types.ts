export interface ToolArtifactRef {
  id: string;
  version?: string;
}

/** Registered customer tools execute on the host server with trusted context. */
export type ToolExecutor<Context = undefined> = (
  args: Record<string, unknown>,
  options: { context: Context; signal: AbortSignal },
) => unknown | Promise<unknown>;

export type ExecuteToolInput<Context = undefined> = {
  name: string;
  arguments?: Record<string, unknown>;
  tools: Record<string, ToolExecutor<Context>>;
  signal?: AbortSignal;
  /** Total execution budget, including customer tools. Default: 60 seconds. */
  timeoutMs?: number;
} & ({ artifact: ToolArtifactRef; response?: never } | { artifact?: never; response?: string }) &
  (undefined extends Context ? { context?: Context } : { context: Context });

export interface ScriptToolCall {
  type?: "function_call";
  call_id: string;
  name: string;
  arguments: string;
}

export type ScriptToolResult =
  | { type: "function_call_output"; call_id: string; output: string }
  | { call_id: string; error: { code: string; message: string } };
