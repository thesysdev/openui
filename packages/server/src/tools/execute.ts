import { abortable } from "../shared/abort";
import { postJSON, ServerClientError, type ClientConfig } from "../shared/client";
import type {
  ExecuteToolInput,
  RegisteredTools,
  ScriptToolCall,
  ScriptToolResult,
  ToolExecutionOptions,
  ToolRegistration,
} from "./types";

const MAX_ROUNDS = 8;
const MAX_TOOL_CALLS = 16;
const DEFAULT_TIMEOUT_MS = 60_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function invalidResponse(): never {
  throw new ServerClientError("Invalid script execution response", "invalid_response", 502);
}

/** Register tool metadata and handlers, or execute an existing handler map. */
export function createTools(config: ClientConfig) {
  async function execute<Context = undefined>(input: ExecuteToolInput<Context>): Promise<unknown> {
    if (!input || typeof input.name !== "string" || !input.name || !isRecord(input.tools)) {
      throw new ServerClientError("A tool name and tools registry are required", "invalid_input");
    }
    const args = input.arguments ?? {};
    if (!isRecord(args))
      throw new ServerClientError("Tool arguments must be an object", "invalid_input");
    const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new ServerClientError("timeoutMs must be a positive finite number", "invalid_input");
    }
    input.signal?.throwIfAborted();
    const controller = new AbortController();
    const forwardAbort = () => controller.abort(input.signal?.reason);
    input.signal?.addEventListener("abort", forwardAbort, { once: true });
    const timer = setTimeout(
      () =>
        controller.abort(new ServerClientError("Tool execution timed out", "tool_timeout", 504)),
      timeoutMs,
    );
    const signal = controller.signal;

    const dispatch = async (name: string, toolArgs: Record<string, unknown>) => {
      signal.throwIfAborted();
      if (!Object.hasOwn(input.tools, name) || typeof input.tools[name] !== "function") {
        throw new ServerClientError(`Unknown customer tool: ${name}`, "tool_not_found", 404);
      }
      return abortable(
        Promise.resolve().then(() =>
          input.tools[name]!(toolArgs, { context: input.context as Context, signal }),
        ),
        signal,
      );
    };

    try {
      if (Object.hasOwn(input.tools, input.name)) return await dispatch(input.name, args);
      if (typeof input.response !== "string" || !input.response.trim()) {
        throw new ServerClientError(
          `Unknown tool: ${input.name}. Supply a complete OpenUI response for script execution.`,
          "tool_not_found",
          404,
        );
      }

      let state: string | undefined;
      let toolResults: ScriptToolResult[] = [];
      const seen = new Set<string>();
      // Allow a final settlement request after the last tool-call round.
      for (let round = 0; round <= MAX_ROUNDS; round++) {
        const response = await abortable(
          postJSON(
            config,
            "/v1/app/execute",
            {
              response: input.response,
              name: input.name,
              arguments: args,
              tool_results: toolResults,
              ...(state !== undefined && { state }),
            },
            signal,
          ),
          signal,
        );
        if (!isRecord(response)) invalidResponse();
        if (response["status"] === "done") return response["result"];
        if (response["status"] === "error") {
          const error = response["error"];
          if (
            !isRecord(error) ||
            typeof error["code"] !== "string" ||
            typeof error["message"] !== "string"
          )
            invalidResponse();
          // Never replay tools after a failed snapshot: a prior call may have mutated data.
          throw new ServerClientError(error["message"], error["code"]);
        }
        const calls = response["calls"];
        if (
          response["status"] !== "tool_calls" ||
          typeof response["state"] !== "string" ||
          !response["state"] ||
          !Array.isArray(calls) ||
          !calls.length
        )
          invalidResponse();
        if (round === MAX_ROUNDS || seen.size + calls.length > MAX_TOOL_CALLS) {
          throw new ServerClientError("Script execution limit exceeded", "script_limit", 502);
        }
        // Validate the complete batch before any customer tool starts.
        for (const call of calls) {
          if (
            !isRecord(call) ||
            (call["type"] !== undefined && call["type"] !== "function_call") ||
            typeof call["call_id"] !== "string" ||
            !call["call_id"] ||
            seen.has(call["call_id"]) ||
            typeof call["name"] !== "string" ||
            !call["name"] ||
            typeof call["arguments"] !== "string"
          )
            invalidResponse();
          seen.add(call["call_id"]);
        }
        state = response["state"];
        toolResults = await Promise.all(
          (calls as ScriptToolCall[]).map(async (call): Promise<ScriptToolResult> => {
            try {
              const toolArgs: unknown = JSON.parse(call.arguments);
              if (!isRecord(toolArgs))
                throw new ServerClientError("Tool arguments must be an object", "bad_args");
              const result = await dispatch(call.name, toolArgs);
              signal.throwIfAborted();
              const output = JSON.stringify(result ?? null);
              if (output === undefined)
                throw new ServerClientError(
                  "Tool result must be JSON serializable",
                  "bad_tool_result",
                );
              return {
                type: "function_call_output",
                call_id: call.call_id,
                output,
              };
            } catch (error) {
              signal.throwIfAborted();
              return {
                call_id: call.call_id,
                error: {
                  code: error instanceof ServerClientError ? error.code : "tool_exec_error",
                  message: error instanceof Error ? error.message : String(error),
                },
              };
            }
          }),
        );
      }
      throw new ServerClientError("Script execution limit exceeded", "script_limit", 502);
    } finally {
      clearTimeout(timer);
      input.signal?.removeEventListener("abort", forwardAbort);
      controller.abort();
    }
  }

  return {
    execute,
    create<Context = undefined>(
      registry: Record<string, ToolRegistration<Context>>,
    ): RegisteredTools<Context> {
      const entries = Object.entries(registry);
      const tools = Object.fromEntries(entries.map(([name, tool]) => [name, tool.execute]));
      const definitions = entries.map(([name, { description, parameters, output }]) => ({
        name,
        parameters,
        ...(description !== undefined && { description }),
        ...(output !== undefined && { output }),
      }));

      return {
        definitions,
        execute(input, options?: ToolExecutionOptions<Context>) {
          // Only request data comes from input; capabilities and context stay server-owned.
          return execute<Context>({
            name: input.name,
            arguments: input.arguments,
            response: input.response,
            tools,
            context: options?.context,
            signal: options?.signal,
            timeoutMs: options?.timeoutMs,
          } as ExecuteToolInput<Context>);
        },
      };
    },
  };
}
