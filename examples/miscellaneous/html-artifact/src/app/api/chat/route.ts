import { cloudInstructions } from "@/lib/cloud-prompt";
import { DEFAULT_MODEL, requiredEnv } from "@/lib/env";
import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
} as const;

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: ChatCompletionMessageParam[] };

  // Chat Completions → POST /v1/embed/chat/completions
  const client = new OpenAI({
    apiKey: requiredEnv("THESYS_API_KEY"),
    baseURL: "https://api.thesys.dev/v1/embed",
  });

  // A rejected key, rate limit, or bad request fails here, before streaming starts.
  // Return it as JSON so the chat shows the real reason instead of a bare 500.
  let stream;
  try {
    stream = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "system", content: cloudInstructions() }, ...messages],
      stream: true,
    });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status },
    );
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(readable, { headers: SSE_HEADERS });
}
