import { graph } from "@/agent";

export const runtime = "nodejs";

/**
 * Runs the LangGraph agent from src/agent/agent.ts in-process and returns its
 * native `messages`-mode SSE stream untransformed. The browser converts
 * outgoing messages with `langGraphMessageFormat` and parses the stream with
 * `langGraphAdapter()`, so no conversion happens here. Nothing is stored
 * server-side, so the full conversation history is sent as graph input.
 */
export async function POST(request: Request) {
  const { messages } = (await request.json()) as {
    messages: { type: string; content: string }[];
  };

  const stream = await graph.stream(
    { messages },
    { streamMode: "messages", encoding: "text/event-stream", signal: request.signal },
  );

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
