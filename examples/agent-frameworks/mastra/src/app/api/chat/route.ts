import { MastraAgent } from "@ag-ui/mastra";
import type { Message } from "@ag-ui/core";
import { NextRequest } from "next/server";
import { openuiAgent } from "@/mastra";

const agent = new MastraAgent({
  agent: openuiAgent,
  resourceId: "chat-user",
});

export async function POST(req: NextRequest) {
  try {
    const { messages, threadId }: { messages: Message[]; threadId: string } = await req.json();
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
              const msg = error.message;
              console.error("Mastra stream error:", error);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
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
