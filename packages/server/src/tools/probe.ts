import { isRecord } from "../client/api";
import { abortable } from "../shared/abort";
import { DRAFT_ID } from "./execute";
import {
  ToolExecutionError,
  type DataTool,
  type ExecutionContext,
  type Interpreter,
} from "./types";

/** The model saves one of the dashboard's scripts and runs it once: `{ name, code, args? }`.
 *  OpenUI Cloud keeps the code; this runs it by name, as a dashboard runs its scripts. */
export const CREATE_SCRIPT_TOOL = "create_script";

/** Runs one round of the model's tool calls, within 60 seconds. */
export async function probeRound<Context extends ExecutionContext>(
  calls: Array<{ id: string; function?: { name?: string; arguments?: string } }>,
  tools: Record<string, DataTool<Context>>,
  context: Context,
  callerSignal: AbortSignal | undefined,
  interpreter: Interpreter<Context>,
  draftId: string | undefined,
) {
  callerSignal?.throwIfAborted();
  const controller = new AbortController();
  const forwardAbort = () => controller.abort(callerSignal?.reason);
  callerSignal?.addEventListener("abort", forwardAbort, { once: true });
  const timer = setTimeout(
    () => controller.abort(new ToolExecutionError("Tool execution timed out", "tool_timeout")),
    60_000,
  );
  const signal = controller.signal;

  try {
    return await Promise.all(
      calls.map(async (call) => {
        let content: string;
        try {
          const name = call.function?.name as string;
          const savesScript = name === CREATE_SCRIPT_TOOL && !Object.hasOwn(tools, name);
          if (!savesScript && !Object.hasOwn(tools, name)) {
            throw new ToolExecutionError(`Unknown tool: ${name}`, "tool_not_found");
          }
          let args: unknown;
          try {
            args = JSON.parse(call.function?.arguments?.trim() || "{}");
          } catch {
            // Not JSON: refused below.
          }
          if (!isRecord(args)) {
            throw new ToolExecutionError("Tool arguments must be a JSON object", "bad_args");
          }
          const scriptName = args["name"];
          const result = savesScript
            ? await interpreter.execute(
                {
                  name: typeof scriptName === "string" ? scriptName : "",
                  arguments: isRecord(args["args"]) ? args["args"] : {},
                },
                context,
                { signal, [DRAFT_ID]: draftId ?? "" } as Parameters<
                  Interpreter<Context>["execute"]
                >[2],
              )
            : await abortable(
                Promise.resolve().then(() => tools[name]!.execute(args, context, { signal })),
                signal,
              );
          content = JSON.stringify(result ?? null);
          if (content === undefined) {
            throw new ToolExecutionError(
              "Tool result must be JSON serializable",
              "bad_tool_result",
            );
          }
        } catch (error) {
          callerSignal?.throwIfAborted();
          // A failing tool is an answer for the model, not a failed build.
          const message = error instanceof Error ? error.message : String(error);
          content = JSON.stringify({
            error: {
              code: error instanceof ToolExecutionError ? error.code : "tool_exec_error",
              message: message.slice(0, 500),
            },
          });
        }
        return { role: "tool", tool_call_id: call.id, content };
      }),
    );
  } finally {
    clearTimeout(timer);
    callerSignal?.removeEventListener("abort", forwardAbort);
    controller.abort();
  }
}
