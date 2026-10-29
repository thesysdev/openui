import { isRecord, type CloudApi } from "../client/api";
import { OpenUIApiError } from "../client/types";
import { abortable } from "../shared/abort";
import {
  ToolExecutionError,
  type Interpreter,
  type InterpreterExecuteOptions,
  type InterpreterOptions,
  type InterpreterRequest,
  type ScriptToolCall,
  type ScriptToolResult,
  type ToolDefinition,
} from "./types";

const MAX_ROUNDS = 8;
const MAX_TOOL_CALLS = 16;
const DEFAULT_TIMEOUT_MS = 60_000;

function invalidResponse(): never {
  throw new ToolExecutionError("Invalid script execution response", "invalid_response", 502);
}

/** What generation sees of your tools: everything but `execute`. */
export function toToolDefinitions(
  tools: Record<string, Omit<ToolDefinition, "name">>,
): ToolDefinition[] {
  return Object.entries(tools).map(([name, { description, parameters, output }]) => ({
    name,
    parameters,
    ...(description !== undefined && { description }),
    ...(output !== undefined && { output }),
  }));
}

/** The interpreter behind `openui.createInterpreter`, on the client's API key. */
export function createInterpreter<Context = undefined>(
  api: CloudApi,
  options: InterpreterOptions<Context>,
): Interpreter<Context> {
  const tools = Object.fromEntries(
    Object.entries(options.tools).map(([name, tool]) => [name, tool.execute]),
  );
  const definitions = toToolDefinitions(options.tools);

  async function execute(
    input: InterpreterRequest,
    executionOptions?: InterpreterExecuteOptions<Context>,
  ): Promise<unknown> {
    if (!input || typeof input.name !== "string" || !input.name) {
      throw new ToolExecutionError("A tool name is required", "invalid_input");
    }
    const args = input.arguments ?? {};
    if (!isRecord(args))
      throw new ToolExecutionError("Tool arguments must be an object", "invalid_input");
    const timeoutMs = executionOptions?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new ToolExecutionError("timeoutMs must be a positive finite number", "invalid_input");
    }
    executionOptions?.signal?.throwIfAborted();
    const controller = new AbortController();
    const forwardAbort = () => controller.abort(executionOptions?.signal?.reason);
    executionOptions?.signal?.addEventListener("abort", forwardAbort, { once: true });
    const timer = setTimeout(
      () =>
        controller.abort(new ToolExecutionError("Tool execution timed out", "tool_timeout", 504)),
      timeoutMs,
    );
    const signal = controller.signal;

    const dispatch = async (name: string, toolArgs: Record<string, unknown>) => {
      signal.throwIfAborted();
      if (!Object.hasOwn(tools, name) || typeof tools[name] !== "function") {
        throw new ToolExecutionError(`Unknown customer tool: ${name}`, "tool_not_found", 404);
      }
      return abortable(
        Promise.resolve().then(() =>
          tools[name]!(executionOptions?.context as Context, toolArgs, { signal }),
        ),
        signal,
      );
    };

    try {
      if (Object.hasOwn(tools, input.name)) return await dispatch(input.name, args);
      // Generated scripts run from the artifact OpenUI Cloud stores.
      if (typeof input.id !== "string" || !input.id) {
        throw new ToolExecutionError(
          `Unknown tool: ${input.name}. Send the artifact's id to run its scripts.`,
          "tool_not_found",
          404,
        );
      }
      const source = { artifact_id: input.id };

      let state: string | undefined;
      let toolResults: ScriptToolResult[] = [];
      const seen = new Set<string>();
      // Allow a final settlement request after the last tool-call round.
      for (let round = 0; round <= MAX_ROUNDS; round++) {
        const response = await abortable(
          executeRound(
            {
              ...source,
              name: input.name,
              arguments: args,
              tool_results: toolResults,
              ...(state !== undefined && { state }),
            },
            signal,
          ),
          signal,
        );
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
          throw new ToolExecutionError(error["message"], error["code"]);
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
          throw new ToolExecutionError("Script execution limit exceeded", "script_limit", 502);
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
                throw new ToolExecutionError("Tool arguments must be an object", "bad_args");
              const result = await dispatch(call.name, toolArgs);
              signal.throwIfAborted();
              const output = JSON.stringify(result ?? null);
              if (output === undefined)
                throw new ToolExecutionError(
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
                  code: error instanceof ToolExecutionError ? error.code : "tool_exec_error",
                  message: error instanceof Error ? error.message : String(error),
                },
              };
            }
          }),
        );
      }
      throw new ToolExecutionError("Script execution limit exceeded", "script_limit", 502);
    } finally {
      clearTimeout(timer);
      executionOptions?.signal?.removeEventListener("abort", forwardAbort);
      controller.abort();
    }
  }

  // One script round; API failures surface as tool errors, with the same code and status.
  async function executeRound(
    body: unknown,
    signal: AbortSignal,
  ): Promise<Record<string, unknown>> {
    try {
      return await api.post("/v1/app/execute", body, signal);
    } catch (error) {
      signal.throwIfAborted();
      if (error instanceof OpenUIApiError) {
        throw new ToolExecutionError(error.message, error.code, error.status);
      }
      throw error;
    }
  }

  return { definitions, execute };
}
