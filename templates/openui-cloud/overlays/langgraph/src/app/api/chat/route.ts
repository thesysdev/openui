import { graph } from "@/agent";
import { resolveRequestedModel } from "@/lib/models";

export const runtime = "nodejs";

/**
 * Runs the LangGraph agent from src/agent.ts in-process and returns its
 * native `messages`-mode SSE stream untransformed. The browser converts
 * outgoing messages with `langGraphMessageFormat` and parses the stream with
 * `langGraphAdapter()`. Chat Completions receives the full history; the agent
 * saves only the new turn to OpenUI Cloud when it finishes.
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

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "messages must be a non-empty array" },
      { status: 400 },
    );
  }

  if (messages.at(-1)?.type !== "human") {
    return Response.json(
      { error: "messages must end with a human message" },
      { status: 400 },
    );
  }

  const model = resolveRequestedModel(requestedModel);
  if (!model) {
    return Response.json(
      { error: "model is not available in this agent" },
      { status: 400 },
    );
  }

  const stream = await graph.stream(
    { messages, conversationId: threadId, model },
    {
      streamMode: "messages",
      encoding: "text/event-stream",
      signal: request.signal,
    },
  );

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
