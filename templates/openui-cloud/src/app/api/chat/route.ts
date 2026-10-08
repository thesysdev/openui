import { graph } from "@/agent";
import { requiredEnv } from "@/lib/env";
import { resolveRequestedModel } from "@/lib/models";
import {
  coerceMessageLikeToMessage,
  isHumanMessage,
  type BaseMessageLike,
} from "@langchain/core/messages";
import { storeLangGraphHistory } from "@openuidev/server/langgraph";

export const runtime = "nodejs";

/** Stream native LangGraph events; the browser supplies the full conversation. */
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

  // Persist the question even if generation is stopped or fails. The graph's
  // afterAgent middleware saves only the new assistant/tool messages on success.
  await storeLangGraphHistory({
    apiKey: requiredEnv("THESYS_API_KEY"),
    conversationId: threadId,
    messages: [question],
  });

  const stream = await graph.stream(
    { messages, model, conversationId: threadId, historyLength: messages.length },
    { streamMode: "messages", encoding: "text/event-stream", signal: request.signal },
  );

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
