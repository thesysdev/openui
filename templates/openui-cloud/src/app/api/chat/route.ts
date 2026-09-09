import { requiredEnv } from "@/lib/env";
import { resolveRequestedModel } from "@/lib/models";
import { runFunctionToolLoop } from "@/lib/tool-loop";
import { executeGetWeather, getWeatherTool } from "@/lib/tools/get-weather";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { artifactTool } from "@openuidev/thesys-server";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import type {
  ResponseCreateParamsNonStreaming,
  ResponseInputItem,
  Tool,
} from "openai/resources/responses/responses";

/**
 * Generation plane: browser → this route → OpenUI Cloud's Responses API,
 * proxying the SSE stream back for `openAIResponsesAdapter` to parse.
 * Cloud tools (artifacts / search / MCP) run inside Cloud; app-owned
 * `type: "function"` tools run here via `runFunctionToolLoop`.
 */
export async function POST(req: Request) {
  const {
    threadId,
    messages,
    model: requestedModel,
  } = (await req.json()) as {
    threadId?: string;
    messages?: ResponseInputItem[];
    model?: unknown;
  };

  if (!threadId) return badRequest("threadId is required — create the conversation first");
  if (!Array.isArray(messages) || messages.length === 0) {
    return badRequest("messages must be a non-empty ResponseInputItem[]");
  }
  // History is stored server-side (conversation + store:true)
  // forward only the latest message upstream.
  const input = messages.slice(-1);
  const model = resolveRequestedModel(requestedModel);
  if (!model) return badRequest("model is not available in this agent");

  const client = new OpenAI({
    baseURL: "https://api.thesys.dev/v1/embed",
    apiKey: requiredEnv("THESYS_API_KEY"), // sent as Authorization: Bearer …
  });

  // App-owned function tools — the loop runs only the names declared here.
  const functionTools = {
    [getWeatherTool.name]: executeGetWeather,
  };

  const createParams: ResponseCreateParamsNonStreaming = {
    model,
    conversation: threadId, // store:true persists to the conversation
    input,
    store: true,
    tools: [
      // artifact/image_search are Cloud extensions of the Responses tool union.
      artifactTool({ artifacts: ["slides", "report"] }) as unknown as Tool,
      { type: "web_search" },
      { type: "image_search" } as unknown as Tool,
      getWeatherTool,
      // Remote MCP servers run inside OpenUI Cloud, e.g.:
      // { type: "mcp", server_label: "deepwiki", server_url: "https://mcp.deepwiki.com/mcp" },
    ],
    instructions: generateSystemPrompt({ cloud: true }),
  };

  let stream: AsyncIterable<Record<string, unknown>>;
  try {
    stream = (await client.responses.create(
      { ...createParams, stream: true },
      { signal: req.signal }, // propagate browser aborts (stop button / tab close)
    )) as unknown as AsyncIterable<Record<string, unknown>>;
  } catch (err) {
    // Propagate the upstream message and status; the chat store surfaces it.
    const e = err as { status?: number; error?: unknown; message?: string };
    return NextResponse.json(
      { error: e.error ?? { message: e.message ?? "upstream error" } },
      { status: e.status ?? 502 },
    );
  }

  // Re-emit SDK events as SSE, executing function tools between model turns.
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      try {
        await runFunctionToolLoop({
          client,
          createParams,
          firstStream: stream,
          tools: functionTools,
          enqueue,
          signal: req.signal,
        });
      } catch (err) {
        enqueue({
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
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

function badRequest(message: string): Response {
  return NextResponse.json({ error: { message } }, { status: 400 });
}
