import { isRecord } from "../../core/guards";
import {
  ToolExecutionError,
  type DataTool,
  type ExecutionContext,
  type Interpreter,
} from "../../interpreter/types";

/** The model's tool to save a script in OpenUI Cloud and run it once: `{ name, code, args? }`. */
export const CREATE_SCRIPT_TOOL = "openui_create_script";

/** A tool call's result, as the model gets it back. */
export type ToolMessage = { role: "tool"; tool_call_id: string; content: string };

/** One of the model's tool calls, as OpenUI Cloud sends it. */
export type ModelToolCall = { id: string; function?: { name?: string; arguments?: string } };

export interface ToolRound<Context extends ExecutionContext> {
  calls: ModelToolCall[];
  tools: Record<string, DataTool<Context>>;
  context: Context;
  signal: AbortSignal | undefined;
  interpreter: Interpreter<Context>;
  /** The dashboard being built, whose saved scripts run by its id. */
  artifactId: string;
  /** The build's version: OpenUI Cloud runs a saved script from the build in progress. */
  version: string | undefined;
}

/** Runs one round of the model's tool calls; each run has the interpreter's timeout. */
export async function runToolRound<Context extends ExecutionContext>({
  calls,
  tools,
  context,
  signal: callerSignal,
  interpreter,
  artifactId,
  version,
}: ToolRound<Context>): Promise<ToolMessage[]> {
  callerSignal?.throwIfAborted();
  const executionOptions = callerSignal ? { signal: callerSignal } : {};
  return Promise.all(
    calls.map(async (call) => {
      const name = call.function?.name as string;
      const savesScript = name === CREATE_SCRIPT_TOOL;
      let content: string;
      try {
        if (!savesScript && !Object.hasOwn(tools, name)) {
          throw new ToolExecutionError(`Unknown tool: ${name}`, "tool_not_found");
        }
        const args: unknown = JSON.parse(call.function?.arguments as string);
        if (!isRecord(args)) {
          throw new ToolExecutionError("Tool arguments must be a JSON object", "bad_args");
        }
        const result = savesScript
          ? await interpreter.execute(
              {
                name: args["name"] as string,
                arguments: args["args"] as Record<string, unknown>,
                id: artifactId,
                version,
              },
              context,
              executionOptions,
            )
          : await interpreter.execute({ name, arguments: args }, context, executionOptions);
        content = JSON.stringify(result ?? null);
      } catch (error) {
        callerSignal?.throwIfAborted();
        // A failing tool is an answer for the model, not a failed build.
        content = JSON.stringify({
          error: {
            code: error instanceof ToolExecutionError ? error.code : "tool_exec_error",
            message: error instanceof Error ? error.message : String(error),
          },
        });
      }
      return { role: "tool" as const, tool_call_id: call.id, content };
    }),
  );
}
