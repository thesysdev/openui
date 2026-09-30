/** A tool requested by an execution engine, independent of its wire format. */
export interface ScriptToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export type ScriptToolResult = { id: string; result: unknown } | { id: string; error: unknown };

export interface ScriptExecutionRequest<State = unknown> {
  /** Opaque engine state. Omitted for the first execution. */
  state?: State;
  results: ScriptToolResult[];
}

export type ScriptExecutionResponse<State = unknown, Result = unknown> =
  | { status: "complete"; result: Result }
  | { status: "tools"; state: State; calls: ScriptToolCall[] };

export interface ExecuteScriptOptions<State = unknown, Result = unknown> {
  /** Starts or resumes execution. Owns transport, serialization, and engine errors. */
  execute: (
    request: ScriptExecutionRequest<State>,
    signal: AbortSignal,
  ) => Promise<ScriptExecutionResponse<State, Result>>;
  callTool: (name: string, input: Record<string, unknown>, signal: AbortSignal) => Promise<unknown>;
  signal?: AbortSignal;
  /** Total execution deadline. Defaults to 60 seconds. */
  timeoutMs?: number;
}

/** Drives execution and tool continuations without assuming a model or API protocol. */
export async function executeScript<State = unknown, Result = unknown>(
  options: ExecuteScriptOptions<State, Result>,
): Promise<Result> {
  const { execute, callTool } = options;
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

  const run = async (): Promise<Result> => {
    let request: ScriptExecutionRequest<State> = { results: [] };
    const seen = new Set<string>();

    for (let round = 0; round <= 8; round++) {
      signal.throwIfAborted();
      const step = await Promise.race([execute(request, signal), aborted]);
      signal.throwIfAborted();
      if (step.status === "complete") return step.result;
      if (!step.calls.length || round === 8 || seen.size + step.calls.length > 16) {
        throw new Error("Empty tool continuation or script execution limit exceeded");
      }

      // Reject repeated calls before dispatching any potentially mutating tools.
      for (const call of step.calls) {
        if (seen.has(call.id)) throw new Error(`Duplicate script tool call: ${call.id}`);
        seen.add(call.id);
      }

      const results: ScriptToolResult[] = [];
      for (const call of step.calls) {
        signal.throwIfAborted();
        try {
          const result = await Promise.race([callTool(call.name, call.input, signal), aborted]);
          results.push({ id: call.id, result });
        } catch (error) {
          signal.throwIfAborted();
          results.push({ id: call.id, error });
        }
      }
      request = { state: step.state, results };
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
