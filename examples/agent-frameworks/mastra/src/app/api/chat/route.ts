import { MastraAgent } from "@ag-ui/mastra";
import type { Message } from "@ag-ui/core";
import { NextRequest } from "next/server";
import { openuiAgent } from "@/mastra";

export async function POST(req: NextRequest) {
  try {
    const { messages, threadId }: { messages: Message[]; threadId: string } = await req.json();
    const agent = new MastraAgent({
      agent: openuiAgent,
      resourceId: "chat-user",
    });
    // The model calls send the threadId, so the Gateway groups the thread's turns into one session.
    if (typeof threadId === "string" && threadId) {
      agent.headers = { "x-thesys-session-id": threadId };
    }
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      start(controller) {
        let closed = false;
        const close = () => {
          if (closed) return;
          closed = true;
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        };

        const subscription = agent
          .run({
            messages,
            threadId,
            runId: crypto.randomUUID(),
            tools: [],
            context: [],
          })
          .subscribe({
            next: (event) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            },
            complete: close,
            error: (error: Error) => {
              console.error("Mastra stream error:", error);
              // An AG-UI RUN_ERROR event, so agUIAdapter shows the error in the chat.
              const runError = { type: "RUN_ERROR", message: error.message };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(runError)}\n\n`));
              close();
            },
          });

        req.signal.addEventListener("abort", () => {
          subscription.unsubscribe();
        });
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown route error";
    console.error("Route error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
