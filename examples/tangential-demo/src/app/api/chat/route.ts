import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const SYSTEM_PROMPT = `You are Tangential Assistant, an AI helper for a project and issue tracking app.
Be concise, practical, and action-oriented.
When asked for planning help, provide clear next steps and tradeoffs.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY is not set on the server." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const body = await req.json();
  const messages = (body?.messages ?? []) as ChatCompletionMessageParam[];

  const client = new OpenAI({ apiKey });

  const stream = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    stream: true,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown streaming error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
