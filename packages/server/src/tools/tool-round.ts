import { isRecord } from "../client/api";
import type { DashboardProgress } from "../client/types";
import type { BuildInterpreter } from "./execute";
import { ToolExecutionError, type DataTool, type ExecutionContext } from "./types";

/** The model saves one of the dashboard's scripts and runs it once: `{ name, code, args? }`.
 *  OpenUI Cloud keeps the code; this runs it by name, as a dashboard runs its scripts. */
export const CREATE_SCRIPT_TOOL = "openui_create_script";

/** Runs one round of the model's tool calls; each run has the interpreter's timeout. */
export async function runToolRound<Context extends ExecutionContext>(
  calls: Array<{ id: string; function?: { name?: string; arguments?: string } }>,
  tools: Record<string, DataTool<Context>>,
  context: Context,
  callerSignal: AbortSignal | undefined,
  interpreter: BuildInterpreter<Context>,
  /** The dashboard being built: its saved scripts run by it. */
  artifactId: string,
  onProgress: (step: DashboardProgress) => void = () => {},
) {
  callerSignal?.throwIfAborted();
  const executionOptions = callerSignal ? { signal: callerSignal } : {};
  return Promise.all(
    calls.map(async (call) => {
      const name = call.function?.name as string;
      const savesScript = name === CREATE_SCRIPT_TOOL;
      let step: { type: "tool" | "script"; name: string } = { type: "tool", name };
      let content: string;
      try {
        if (!savesScript && !Object.hasOwn(tools, name)) {
          throw new ToolExecutionError(`Unknown tool: ${name}`, "tool_not_found");
        }
        const args: unknown = JSON.parse(call.function?.arguments as string);
        if (!isRecord(args)) {
          throw new ToolExecutionError("Tool arguments must be a JSON object", "bad_args");
        }
        if (savesScript) step = { type: "script", name: args["name"] as string };
        onProgress({ ...step, status: "running" });
        const result = savesScript
          ? await interpreter.runDraft(
              artifactId,
              args["name"] as string,
              args["args"] as Record<string, unknown>,
              context,
              executionOptions,
            )
          : await interpreter.execute({ name, arguments: args }, context, executionOptions);
        content = JSON.stringify(result ?? null);
        onProgress({ ...step, status: "done" });
      } catch (error) {
        callerSignal?.throwIfAborted();
        // A failing tool is an answer for the model, not a failed build.
        onProgress({ ...step, status: "error" });
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
