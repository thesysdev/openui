import { graph } from "@/agent";
import { resolveRequestedModel } from "@/lib/models";

export const runtime = "nodejs";

/** Stream native LangGraph events; the browser supplies the full conversation. */
export async function POST(request: Request) {
  const { messages, model: requestedModel } = (await request.json()) as {
    messages: { type: string; content: string }[];
    model?: unknown;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages must be a non-empty array" }, { status: 400 });
  }

  const model = resolveRequestedModel(requestedModel);
  if (!model) {
    return Response.json({ error: "model is not available in this agent" }, { status: 400 });
  }

  const stream = await graph.stream(
    { messages, model },
    { streamMode: "messages", encoding: "text/event-stream", signal: request.signal },
  );

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
