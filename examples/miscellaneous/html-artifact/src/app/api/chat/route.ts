import { cloudInstructions } from "@/lib/cloud-prompt";
import { CLOUD_API_URL, CLOUD_EMBED_URL, DEFAULT_MODEL, requiredEnv } from "@/lib/env";
import { storeChatCompletionHistory } from "@openuidev/server";
import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
} as const;

export async function POST(req: NextRequest) {
  const { messages, threadId } = (await req.json()) as {
    messages: ChatCompletionMessageParam[];
    threadId?: string;
  };

  const apiKey = requiredEnv("THESYS_API_KEY");

  // Chat Completions → POST /v1/embed/chat/completions
  const client = new OpenAI({
    apiKey,
    baseURL: CLOUD_EMBED_URL,
  });

  const stream = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: "system", content: cloudInstructions() }, ...messages],
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let assistantContent = "";
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (typeof delta === "string") assistantContent += delta;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }

      // Chat Completions has no `conversation` + `store: true`. Persist only
      // the new turn so Cloud storage can reload it without duplicating items.
      if (!threadId) return;
      const lastUser = [...messages].reverse().find((message) => message.role === "user");
      try {
        await storeChatCompletionHistory({
          apiKey,
          apiBaseUrl: CLOUD_API_URL,
          conversationId: threadId,
          messages: [
            ...(lastUser ? [lastUser] : []),
            { role: "assistant", content: assistantContent },
          ],
        });
      } catch (err) {
        console.error("[chat] persist failed:", err);
      }
    },
  });

  return new Response(readable, { headers: SSE_HEADERS });
}
