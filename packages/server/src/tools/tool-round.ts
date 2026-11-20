import { isRecord } from "../client/api";
import {
  ToolExecutionError,
  type DataTool,
  type ExecutionContext,
  type Interpreter,
} from "./types";

/** The model saves one of the dashboard's scripts and runs it once: `{ name, code, args? }`.
 *  OpenUI Cloud keeps the code; this runs it by name, as a dashboard runs its scripts. */
export const CREATE_SCRIPT_TOOL = "openui_create_script";

/** Runs one round of the model's tool calls; each run has the interpreter's timeout. */
export async function runToolRound<Context extends ExecutionContext>(
  calls: Array<{ id: string; function?: { name?: string; arguments?: string } }>,
  tools: Record<string, DataTool<Context>>,
  context: Context,
  callerSignal: AbortSignal | undefined,
  interpreter: Interpreter<Context>,
  /** The dashboard being built: its saved scripts run by it. */
  artifactId: string,
  /** The build's version: OpenUI Cloud runs a saved script from the build in progress. */
  version: string | undefined,
) {
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
      return { role: "tool", tool_call_id: call.id, content };
    }),
  );
}
