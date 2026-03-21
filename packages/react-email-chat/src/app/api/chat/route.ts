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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanMessages = (messages as any[])
    .filter((m) => m.role !== "tool")
    .map((m) => {
      if (m.role === "assistant" && m.tool_calls?.length) {
        const { tool_calls: _tc, ...rest } = m; // eslint-disable-line @typescript-eslint/no-unused-vars
        return rest;
      }
      return m;
    });

  const chatMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...cleanMessages,
  ];

  const stream = await client.chat.completions.create({
    model: "gpt-4o",
    messages: chatMessages,
    stream: true,
  });

  const encoder = new TextEncoder();
  let controllerClosed = false;

  const readable = new ReadableStream({
    async start(controller) {
      const enqueue = (data: Uint8Array) => {
        if (controllerClosed) return;
        try {
          controller.enqueue(data);
        } catch {
          /* already closed */
        }
      };
      const close = () => {
        if (controllerClosed) return;
        controllerClosed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      try {
        for await (const chunk of stream) {
          const choice = chunk.choices?.[0];
          const delta = choice?.delta;

          // Only send chunks that have content or signal completion
          if (delta?.content) {
            enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          }
          if (choice?.finish_reason === "stop") {
            enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream error";
        console.error("Chat route error:", msg);
        enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        enqueue(encoder.encode("data: [DONE]\n\n"));
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
