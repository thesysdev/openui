import { graph } from "@/agent";
import { resolveRequestedModel } from "@/lib/models";
import { openui, ownsThread } from "@/lib/openui";
import {
  coerceMessageLikeToMessage,
  isHumanMessage,
  type BaseMessageLike,
} from "@langchain/core/messages";

export const runtime = "nodejs";

/**
 * Stream native LangGraph events. The earlier turns come from the thread's conversation, so only
 * the browser's last message, the new question, is used.
 */
export async function POST(request: Request) {
  const {
    messages: input,
    threadId,
    model: requestedModel,
  } = (await request.json()) as {
    messages?: BaseMessageLike[];
    threadId?: string;
    model?: unknown;
  };

  if (!Array.isArray(input) || input.length === 0) {
    return Response.json({ error: "messages must be a non-empty array" }, { status: 400 });
  }

  if (typeof threadId !== "string" || !threadId.trim()) {
    return Response.json({ error: "threadId is required" }, { status: 400 });
  }

  let messages;
  try {
    messages = input.map(coerceMessageLikeToMessage);
  } catch {
    return Response.json(
      { error: "messages must contain valid LangGraph messages" },
      { status: 400 },
    );
  }
  const question = messages.at(-1)!;
  if (!isHumanMessage(question)) {
    return Response.json({ error: "messages must end with a user message" }, { status: 400 });
  }

  const model = resolveRequestedModel(requestedModel);
  if (!model) {
    return Response.json({ error: "model is not available in this agent" }, { status: 400 });
  }

  if (!(await ownsThread(threadId, request.signal))) {
    return Response.json({ error: "Thread not found" }, { status: 404 });
  }
  const history = await openui.langgraph.conversations.items.list(threadId, {
    signal: request.signal,
  });

  const stream = await graph.stream(
    {
      messages: [...history.map(coerceMessageLikeToMessage), question],
      model,
      conversationId: threadId,
      turnStart: history.length,
    },
    { streamMode: "messages", encoding: "text/event-stream", signal: request.signal },
  );

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
