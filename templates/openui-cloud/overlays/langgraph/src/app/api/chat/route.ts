import { graph } from "@/agent";
import { resolveRequestedModel } from "@/lib/models";

export const runtime = "nodejs";

/**
 * Runs the LangGraph agent from src/agent/agent.ts in-process and returns its
 * native `messages`-mode SSE stream untransformed. The browser converts
 * outgoing messages with `langGraphMessageFormat` and parses the stream with
 * `langGraphAdapter()`, so no conversion happens here. OpenUI Cloud stores
 * prior turns, so only the newest message is sent as graph input.
 */
export async function POST(request: Request) {
  const {
    messages,
    threadId,
    model: requestedModel,
  } = (await request.json()) as {
    messages: { type: string; content: string }[];
    threadId: string;
    model?: unknown;
  };

  if (!threadId) {
    return Response.json(
      { error: "threadId is required — create the conversation first" },
      { status: 400 },
    );
  }

  const model = resolveRequestedModel(requestedModel);
  if (!model) {
    return Response.json({ error: "model is not available in this agent" }, { status: 400 });
  }

  const stream = await graph.stream(
    { messages: messages.slice(-1), conversationId: threadId, model },
    { streamMode: "messages", encoding: "text/event-stream", signal: request.signal },
  );

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
