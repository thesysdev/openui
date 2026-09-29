import OpenAI from "openai";
import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { z } from "zod/v4";
import { listDocuments, openDatabase, type Document } from "../../../lib/documents";
import { rejectOtherOrigins } from "../../../lib/local-origin";
import { comparisonPrompt } from "../../../lib/prompt";
import { runChatToolLoop } from "../../../lib/tool-loop";
import { executeSearchDocuments, searchDocumentsTool } from "../../../lib/tools/search-documents";

export const runtime = "nodejs";

// Chat Completions keeps no state, so the browser sends the whole conversation on every turn.
// Forward only user questions and assistant answers. Tool calls and results from the browser
// are dropped, so every passage the model cites comes from a search this server runs.
const chatRequestSchema = z.object({
  messages: z
    .array(
      z.discriminatedUnion("role", [
        z.object({ role: z.literal("user"), content: z.string().trim().min(1).max(600) }),
        z.object({ role: z.literal("assistant"), content: z.string().nullish() }),
        z.object({ role: z.literal("tool") }),
      ]),
    )
    .min(1)
    .max(100)
    .refine((messages) => messages.at(-1)?.role === "user"),
});

function conversation(messages: z.infer<typeof chatRequestSchema>["messages"]) {
  return messages.flatMap((message): ChatCompletionMessageParam[] =>
    message.role === "tool" || !message.content
      ? []
      : [{ role: message.role, content: message.content }],
  );
}

async function parseChatRequest(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json")
    throw new Error("Send JSON.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Send a question.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1_000_000) {
        await reader.cancel();
        throw new Error("Request too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return chatRequestSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
}

export async function POST(request: Request) {
  const denied = rejectOtherOrigins(request);
  if (denied) return denied;
  let body;
  try {
    body = await parseChatRequest(request);
  } catch {
    return Response.json(
      { error: "Send the conversation, ending with a question of up to 600 characters." },
      { status: 400 },
    );
  }
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey || !process.env.OPENAI_API_KEY)
    return Response.json(
      {
        error: "Configure THESYS_API_KEY and OPENAI_API_KEY privately in .env.local and restart.",
      },
      { status: 503 },
    );

  let documents: Document[];
  let db;
  try {
    db = openDatabase();
    documents = listDocuments(db);
  } catch {
    return Response.json(
      { error: "Prepare the documents with npm run prepare:documents before asking a question." },
      { status: 503 },
    );
  } finally {
    db?.close();
  }

  const gateway = new OpenAI({ apiKey, baseURL: "https://api.thesys.dev/v1/embed" });
  // App-owned function tools. The loop runs only the names registered here.
  const searchTool = searchDocumentsTool(documents);
  const functionTools = { [searchTool.function.name]: executeSearchDocuments };

  const params = {
    model: process.env.OPENUI_MODEL || "openai/gpt-5.5",
    messages: [
      { role: "system" as const, content: comparisonPrompt(documents) },
      ...conversation(body.messages),
    ],
    tools: [searchTool],
    max_completion_tokens: 6000,
  };

  // Open the first round before responding, so a rejected key, rate limit, or unknown model
  // returns as an HTTP error with Gateway's status instead of an event mid-stream.
  let firstStream: AsyncIterable<ChatCompletionChunk>;
  try {
    firstStream = await gateway.chat.completions.create(
      { ...params, stream: true },
      { signal: request.signal },
    );
  } catch (error) {
    const upstream = error as { status?: number; message?: string };
    return Response.json(
      { error: upstream.message ?? "OpenUI Gateway request failed." },
      { status: upstream.status ?? 502 },
    );
  }

  // Stream AG-UI events to the browser, running app-owned tools between model turns.
  const encoder = new TextEncoder();
  let open = true;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Stop sending once the browser disconnects.
      const emit = (event: Record<string, unknown>) => {
        if (open) controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      try {
        await runChatToolLoop({
          client: gateway,
          params,
          firstStream,
          tools: functionTools,
          emit,
          signal: request.signal,
          maxRounds: 4,
        });
      } catch (error) {
        emit({
          type: "RUN_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        if (open) controller.close();
      }
    },
    cancel() {
      open = false;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
