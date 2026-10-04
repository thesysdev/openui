import { appToolDeclarations, appToolExecutors } from "@/lib/app-tools";
import { cloudInstructions } from "@/lib/cloud-prompt";
import { DEFAULT_MODEL, requiredEnv } from "@/lib/env";
import { runChatToolLoop } from "@/lib/tool-loop";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export async function POST(req: Request) {
  const { messages } = (await req.json()) as {
    messages?: ChatCompletionMessageParam[];
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: { message: "messages must be a non-empty ChatCompletionMessageParam[]" } },
      { status: 400 },
    );
  }

  const client = new OpenAI({
    baseURL: "https://api.thesys.dev/v1/embed",
    apiKey: requiredEnv("THESYS_API_KEY"),
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (chunk: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      };
      try {
        await runChatToolLoop({
          client,
          model: DEFAULT_MODEL,
          messages: [{ role: "system", content: cloudInstructions() }, ...messages],
          tools: appToolDeclarations,
          executors: appToolExecutors,
          enqueue,
          signal: req.signal,
        });
      } catch (err) {
        enqueue({ error: err instanceof Error ? err.message : String(err) });
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
