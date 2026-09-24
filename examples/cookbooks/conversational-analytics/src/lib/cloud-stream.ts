// Preserve the Responses SSE protocol consumed by openAIResponsesAdapter().
export function forwardCloudStream(
  events: AsyncIterable<{ type: string }>,
  abort: AbortController,
  cleanup: () => void = () => {},
) {
  const encoder = new TextEncoder();
  let cancelled = false;
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        let complete = false;
        for await (const event of events) {
          if (abort.signal.aborted) break;
          if (
            ["error", "response.failed", "response.incomplete", "response.refusal.delta"].includes(
              event.type,
            )
          )
            throw new Error(
              "OpenUI Cloud did not complete this response. Try again or open the example dashboard.",
            );
          if (event.type === "response.completed") complete = true;
          send(event);
        }
        if (!complete && !abort.signal.aborted)
          throw new Error("The Cloud response ended early. Try again.");
      } catch (error) {
        if (!cancelled && !abort.signal.aborted)
          send({
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
