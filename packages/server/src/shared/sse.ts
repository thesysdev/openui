import type { StreamAdapter } from "./types";

// Convert a supported event stream to SSE or Eve NDJSON without changing its event objects.
export function toSSE<T>(
  chunks: AsyncIterable<T>,
  protocol: StreamAdapter<unknown>["protocol"],
  cancel: (reason?: unknown) => void,
): Response {
  const iterator = chunks[Symbol.asyncIterator]();
  const encoder = new TextEncoder();
  const ndjson = protocol === "eve";
  return new Response(
    new ReadableStream<Uint8Array>({
      // Pull and frame one native event at a time, respecting consumer backpressure.
      async pull(controller) {
        try {
          const next = await iterator.next();
          if (next.done) {
            // Completions, Responses, and AI SDK SSE end with [DONE]; Eve NDJSON just closes.
            if (!ndjson) controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } else if (ndjson) {
            controller.enqueue(encoder.encode(`${JSON.stringify(next.value)}\n`));
          } else {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(next.value)}\n\n`));
          }
        } catch (error) {
          controller.error(error);
        }
      },
      // Stop upstream work when the HTTP consumer disconnects.
      cancel(reason) {
        cancel(reason);
        void iterator.return?.().catch(() => {});
      },
    }),
    {
      headers: {
        "Content-Type": ndjson ? "application/x-ndjson" : "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
        ...(protocol === "vercel-ai" && { "x-vercel-ai-ui-message-stream": "v1" }),
      },
    },
  );
}
