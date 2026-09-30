export interface ScriptToolResult {
  type?: "function_call_output";
  call_id: string;
  output?: string;
  error?: { code: string; message: string };
}

export interface ScriptExecutionRequest {
  /** Complete OpenUI response; the server selects the named script. */
  response: string;
  name: string;
  arguments: Record<string, unknown>;
  tool_results: ScriptToolResult[];
  state?: string;
}

export type ScriptExecutionResponse =
  | { status: "done"; result: unknown; logs?: string[] }
  | {
      status: "error";
      error: { code: string; message: string };
      logs?: string[];
    }
  | {
      status: "tool_calls";
      state: string;
      calls: Array<{
        type: "function_call";
        call_id: string;
        name: string;
        arguments: string;
      }>;
    };

export interface ExecuteScriptOptions {
  /** Complete OpenUI bundle, including the scripts section. */
  response: string;
  name: string;
  arguments: Record<string, unknown>;
  /** Calls the stateless execution endpoint using the application's transport. */
  execute: (
    request: ScriptExecutionRequest,
    signal: AbortSignal,
  ) => Promise<ScriptExecutionResponse>;
  /** Runs a registered customer tool requested by the script. */
  callTool: (name: string, args: Record<string, unknown>, signal: AbortSignal) => Promise<unknown>;
  signal?: AbortSignal;
  /** Total execution deadline. Defaults to 60 seconds. */
  timeoutMs?: number;
}

/** Runs a script and resumes it with customer tool results until completion. */
export async function executeScript(options: ExecuteScriptOptions): Promise<unknown> {
  const { response, name, arguments: args, execute, callTool } = options;
  const controller = new AbortController();
  const { signal } = controller;
  const forwardAbort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", forwardAbort, { once: true });
  if (options.signal?.aborted) forwardAbort();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 60_000);
  let onAbort: () => void = () => {};
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => reject(new Error("Script execution aborted or timed out"));
    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) onAbort();
  });
  const run = async () => {
    let request: ScriptExecutionRequest = {
      response,
      name,
      arguments: args,
      tool_results: [],
    };
    const seen = new Set<string>();
    for (let round = 0; round <= 8; round++) {
      signal.throwIfAborted();
      const result = await Promise.race([execute(request, signal), aborted]);
      signal.throwIfAborted();
      if (result?.status === "done") return result.result;
      if (result?.status === "error") throw new Error(result.error.message);
      if (
        result?.status !== "tool_calls" ||
        typeof result.state !== "string" ||
        !Array.isArray(result.calls) ||
        !result.calls.length ||
        round === 8 ||
        seen.size + result.calls.length > 16
      )
        throw new Error("Invalid script continuation or execution limit exceeded");
      // Validate the complete batch before starting any customer tool.
      for (const call of result.calls) {
        if (
          call.type !== "function_call" ||
          typeof call.call_id !== "string" ||
          seen.has(call.call_id) ||
          typeof call.name !== "string" ||
          typeof call.arguments !== "string"
        )
          throw new Error("Invalid script tool call");
        seen.add(call.call_id);
      }
      const tool_results: ScriptToolResult[] = [];
      for (const call of result.calls) {
        signal.throwIfAborted();
        try {
          const input = JSON.parse(call.arguments);
          if (!input || typeof input !== "object" || Array.isArray(input))
            throw new Error("Tool arguments must be an object");
          const output = await Promise.race([callTool(call.name, input, signal), aborted]);
          tool_results.push({
            type: "function_call_output",
            call_id: call.call_id,
            output: JSON.stringify(output ?? null),
          });
        } catch (error) {
          signal.throwIfAborted();
          tool_results.push({
            call_id: call.call_id,
            error: {
              code: "tool_error",
              message: error instanceof Error ? error.message : String(error),
            },
          });
        }
      }
      request = { ...request, state: result.state, tool_results };
    }
    throw new Error("Script execution limit exceeded");
  };
  try {
    return await Promise.race([run(), aborted]);
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", forwardAbort);
    signal.removeEventListener("abort", onAbort);
  }
}
