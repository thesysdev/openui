// Convert either supported event stream to SSE without changing its event objects.
export function toSSE<T>(
  chunks: AsyncIterable<T>,
  protocol: "chat-completions" | "responses",
  cancel: (reason?: unknown) => void,
): Response {
  const iterator = chunks[Symbol.asyncIterator]();
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      // Pull and frame one native event at a time, respecting consumer backpressure.
      async pull(controller) {
        try {
          const next = await iterator.next();
          if (next.done) {
            if (protocol === "chat-completions")
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } else {
            const name =
              protocol === "responses" ? `event: ${(next.value as { type: string }).type}\n` : "";
            controller.enqueue(encoder.encode(`${name}data: ${JSON.stringify(next.value)}\n\n`));
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
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    },
  );
}
