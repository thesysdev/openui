import { EventType, type AGUIEvent } from "@ag-ui/core";
import { randomUUID } from "node:crypto";
import { runAgent, type ChatInput } from "@/server/agent";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY || !process.env.OPENUI_API_KEY) {
    return Response.json(
      { error: "Set OPENAI_API_KEY and OPENUI_API_KEY in your environment." },
      { status: 503 },
    );
  }
  const input = (await request.json()) as ChatInput;
  const controller = new AbortController();
  const abort = () => controller.abort(request.signal.reason);
  request.signal.addEventListener("abort", abort, { once: true });
  if (request.signal.aborted) abort();
  let cancelled = false;
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(output) {
      const emit = (event: AGUIEvent) => {
        if (!cancelled) output.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      const runId = randomUUID();
      emit({
        type: EventType.RUN_STARTED,
        threadId: input.threadId,
        runId,
      });
      void runAgent(input, controller.signal, emit)
        .then(() => emit({ type: EventType.RUN_FINISHED, threadId: input.threadId, runId }))
        .catch((error: unknown) => {
          emit({
            type: EventType.RUN_ERROR,
            message: error instanceof Error ? error.message : "Generation failed",
          });
        })
        .finally(() => {
          request.signal.removeEventListener("abort", abort);
          if (!cancelled) output.close();
        });
    },
    cancel() {
      cancelled = true;
      controller.abort();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform" },
  });
}
