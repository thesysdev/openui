import { requiredEnv } from "@/lib/env";
import librarySpec from "@/generated/spec.json";
import { resolveRequestedModel } from "@/lib/models";
import { runFunctionToolLoop } from "@/lib/tool-loop";
import { executeGetWeather, getWeatherTool } from "@/lib/tools/get-weather";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { storeChatCompletionHistory } from "@openuidev/server/openai";
import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
  ChatCompletionChunk,
} from "openai/resources/chat/completions";

/** Chat Completions generation with app-owned tools and explicit Cloud storage. */
export async function POST(req: Request) {
  const {
    threadId,
    messages,
    model: requestedModel,
  } = (await req.json()) as {
    threadId?: string;
    messages?: ChatCompletionMessageParam[];
    model?: unknown;
  };

  if (!threadId)
    return badRequest("threadId is required — create the conversation first");
  if (!Array.isArray(messages) || messages.length === 0) {
    return badRequest(
      "messages must be a non-empty ChatCompletionMessageParam[]",
    );
  }
  if (messages.at(-1)?.role !== "user")
    return badRequest("messages must end with a user message");
  const model = resolveRequestedModel(requestedModel);
  if (!model) return badRequest("model is not available in this agent");

  const client = new OpenAI({
    baseURL: "https://api.thesys.dev/v1/embed",
    apiKey: requiredEnv("THESYS_API_KEY"), // sent as Authorization: Bearer …
  });

  // App-owned function tools — the loop runs only the names declared here.
  const functionTools = {
    [getWeatherTool.function.name]: executeGetWeather,
  };

  const createParams: ChatCompletionCreateParamsNonStreaming = {
    model,
    messages: [
      {
        role: "system",
        content: generateSystemPrompt({ cloud: true, library: librarySpec }),
      },
      ...messages,
    ],
    tools: [getWeatherTool],
  };

  let stream: AsyncIterable<ChatCompletionChunk>;
  try {
    stream = await client.chat.completions.create(
      { ...createParams, stream: true },
      { signal: req.signal }, // propagate browser aborts (stop button / tab close)
    );
  } catch (err) {
    // Propagate the upstream message and status; the chat store surfaces it.
    const e = err as { status?: number; error?: unknown; message?: string };
    return NextResponse.json(
      { error: e.error ?? { message: e.message ?? "upstream error" } },
      { status: e.status ?? 502 },
    );
  }

  // Forward native Chat Completions chunks as SSE for openAIAdapter().
  const encoder = new TextEncoder();
  let open = true;
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (event: ChatCompletionChunk) => {
        if (open)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
      };
      try {
        const turn = await runFunctionToolLoop({
          client,
          createParams,
          firstStream: stream,
          tools: functionTools,
          enqueue,
          signal: req.signal,
        });
        await storeChatCompletionHistory({
          apiKey: requiredEnv("THESYS_API_KEY"),
          conversationId: threadId,
          messages: [...messages.slice(-1), ...turn],
        });
        if (open) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      } catch (err) {
        if (open) controller.error(err);
      }
    },
    cancel() {
      open = false;
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

function badRequest(message: string): Response {
  return NextResponse.json({ error: { message } }, { status: 400 });
}
