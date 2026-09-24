import { runFunctionToolLoop, type RunFunctionToolLoopOptions } from "./tool-loop";

// Preserve the Responses SSE protocol, including real tool calls and outputs.
export function streamGatewayTurn(
  options: Omit<RunFunctionToolLoopOptions, "enqueue" | "signal">,
  abort: AbortController,
  cleanup: () => void = () => {},
) {
  const encoder = new TextEncoder();
  let cancelled = false;
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (event: Record<string, unknown>) => {
        if (!cancelled && !abort.signal.aborted)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      // Flush headers immediately, including while Gateway opens its first response.
      controller.enqueue(encoder.encode(": connected\n\n"));
      try {
        await runFunctionToolLoop({ ...options, enqueue, signal: abort.signal });
      } catch (error) {
        enqueue({
          type: "error",
          message: error instanceof Error ? error.message : "Generation interrupted.",
        });
      } finally {
        cleanup();
        if (!cancelled) controller.close();
      }
    },
    cancel() {
      cancelled = true;
      abort.abort();
      cleanup();
    },
  });
}
