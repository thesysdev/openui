import { readFileSync } from "fs";
import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";
import { join } from "path";

const systemPrompt = readFileSync(join(process.cwd(), "src/generated/system-prompt.txt"), "utf-8");

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const chatMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const stream = await client.chat.completions.create({
    model: "gpt-5.4",
    messages: chatMessages,
    stream: true,
  });

  const encoder = new TextEncoder();
  let controllerClosed = false;

  const readable = new ReadableStream({
    async start(controller) {
      const enqueue = (data: Uint8Array) => {
        if (controllerClosed) return;
        try { controller.enqueue(data); } catch { /* already closed */ }
      };
      const close = () => {
        if (controllerClosed) return;
        controllerClosed = true;
        try { controller.close(); } catch { /* already closed */ }
      };

      try {
        for await (const chunk of stream) {
          enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
        enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream error";
        console.error("Chat route error:", msg);
        enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        close();
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
