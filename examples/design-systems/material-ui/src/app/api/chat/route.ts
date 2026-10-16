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

  // Resolves on the first chunk, or with the error if the run fails before any output,
  // so a rejected key or rate limit returns as an HTTP error the chat can show.
  let settle!: (error?: unknown) => void;
  const started = new Promise<unknown>((resolve) => (settle = resolve));

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (chunk: unknown) => {
        settle();
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
        settle(err);
        enqueue({ error: err instanceof Error ? err.message : String(err) });
      } finally {
        settle();
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  const error = await started;
  if (error) {
    const status = (error as { status?: number }).status ?? 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status },
    );
  }

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
