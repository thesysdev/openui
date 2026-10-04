import { executeScript } from "./execute-script";
import { THESYS_API_BASE_URL } from "./shared/constants";

/** Application-owned handler. Forward the signal to cancellable work. */
export type ToolHandler = (
  args: Record<string, unknown>,
  signal: AbortSignal,
) => unknown | Promise<unknown>;

export interface ToolExecutorOptions {
  tools: Record<string, ToolHandler>;
  apiKey?: string;
  /** Gateway origin; defaults to https://api.thesys.dev. */
  apiBaseUrl?: string;
  fetch?: typeof globalThis.fetch;
  /** Deadline for the whole execution, including application tools. Defaults to 60 seconds. */
  timeoutMs?: number;
}

export interface ToolExecutionInput {
  name: string;
  arguments?: Record<string, unknown>;
  /** Complete OpenUI response. Required only when resolving a generated script. */
  response?: string;
}

export interface ToolExecutor {
  execute(input: ToolExecutionInput, options?: { signal?: AbortSignal }): Promise<unknown>;
}

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

type ExecutionResponse =
  | { status: "done"; result: unknown }
  | { status: "error"; error: { code: string; message: string } }
  | {
      status: "tool_calls";
      state: string;
      calls: { call_id: string; name: string; arguments: string }[];
    };

/** Dispatch registered tools directly, or execute a script from the supplied response. */
export function createToolExecutor(options: ToolExecutorOptions): ToolExecutor {
  const { tools } = options;
  const endpoint = `${(options.apiBaseUrl ?? THESYS_API_BASE_URL).replace(/\/+$/, "")}/v1/app/execute`;
  const fetchFn = options.fetch ?? globalThis.fetch;

  const callTool = async (
    name: string,
    args: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<unknown> => {
    signal.throwIfAborted();
    // Script continuations can only call registered handlers, never other scripts.
    if (!Object.hasOwn(tools, name)) {
      throw new ToolExecutionError(`Unknown registered tool: ${name}`, "tool_not_found");
    }
    return tools[name]!(args, signal);
  };

  return {
    execute(input, executionOptions = {}) {
      return executeScript<string>({
        signal: executionOptions.signal,
        timeoutMs: options.timeoutMs,
        callTool,
        execute: async ({ state, results }, signal) => {
          if (Object.hasOwn(tools, input.name)) {
            return {
              status: "complete",
              result: await callTool(input.name, input.arguments ?? {}, signal),
            };
          }
          if (!input.response) {
            throw new ToolExecutionError(
              `Unknown tool: ${input.name}. Supply a complete OpenUI response to resolve a script.`,
              "tool_not_found",
            );
          }

          const response = await fetchFn(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {}),
            },
            body: JSON.stringify({
              name: input.name,
              arguments: input.arguments ?? {},
              response: input.response,
              state,
              tool_results: results.map((item) =>
                "error" in item
                  ? {
                      call_id: item.id,
                      error: {
                        code: "tool_error",
                        message:
                          item.error instanceof Error ? item.error.message : String(item.error),
                      },
                    }
                  : {
                      type: "function_call_output",
                      call_id: item.id,
                      output: JSON.stringify(item.result ?? null),
                    },
              ),
            }),
            signal,
          });

          let body: ExecutionResponse;
          try {
            body = await response.json();
          } catch {
            signal.throwIfAborted();
            throw new ToolExecutionError(
              `Script execution returned an unreadable response (HTTP ${response.status})`,
              "invalid_response",
              response.status,
            );
          }
          signal.throwIfAborted();
          if (!response.ok) {
            const error = (body as { error?: { code?: string; message?: string } } | null)?.error;
            throw new ToolExecutionError(
              error?.message ?? `Script execution failed (HTTP ${response.status})`,
              error?.code ?? "http_error",
              response.status,
            );
          }

          switch (body?.status) {
            case "done":
              return { status: "complete", result: body.result };
            case "error":
              throw new ToolExecutionError(body.error.message, body.error.code, response.status);
            case "tool_calls":
              return {
                status: "tools",
                state: body.state,
                calls: body.calls.map((call) => ({
                  id: call.call_id,
                  name: call.name,
                  input: JSON.parse(call.arguments),
                })),
              };
            default:
              throw new ToolExecutionError(
                "Unexpected script execution response",
                "invalid_response",
                response.status,
              );
          }
        },
      });
    },
  };
}
