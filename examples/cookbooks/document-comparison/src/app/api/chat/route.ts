import { storeChatCompletionHistory } from "@openuidev/server/openai";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { z } from "zod/v4";
import { listDocuments, openDatabase, type Document } from "../../../lib/documents";
import { comparisonPrompt } from "../../../lib/prompt";
import { executeSearchDocuments, searchDocumentsTool } from "../../../lib/tools/search-documents";

export const runtime = "nodejs";

// Chat Completions keeps no state, so the browser sends the whole conversation on every turn.
// Forward only user questions and assistant answers. Tool calls and results from the browser
// are dropped, so every passage the model cites comes from a search this server runs.
const chatRequestSchema = z.object({
  // Agent Interface's storage creates the Gateway conversation first and sends its id here.
  threadId: z.string().min(1).max(200),
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
  // This example has no authentication, so it accepts browser requests only from its own
  // local page. Add authentication and rate limits before deploying it.
  const { port } = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== `http://127.0.0.1:${port}` && origin !== `http://localhost:${port}`)
    return Response.json(
      { error: "This example only accepts requests from its local chat interface." },
      { status: 403 },
    );
  let body;
  try {
    body = await parseChatRequest(request);
  } catch {
    return Response.json(
      {
        error:
          "Send a threadId and the conversation, ending with a question of up to 600 characters.",
      },
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
  const searchTool = searchDocumentsTool(documents);

  const { threadId } = body;
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: comparisonPrompt(documents) },
    ...conversation(body.messages),
  ];

  // runTools requests a completion, runs the tools the model calls, sends their results back, and
  // repeats until the model answers. It runs only the tools registered here.
  const runner = gateway.chat.completions.runTools(
    {
      model: process.env.OPENUI_MODEL || "openai/gpt-5.5",
      messages,
      tools: [
        {
          type: "function",
          function: {
            ...searchTool.function,
            // runTools ends the run when a tool throws, so return the error as the tool's result.
            function: (args: string) =>
              executeSearchDocuments(args, { signal: request.signal }).catch((error: unknown) =>
                JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
              ),
          },
        },
      ],
      max_completion_tokens: 6000,
      stream: true,
    },
    { signal: request.signal, maxChatCompletions: 4 },
  );

  // Chat Completions doesn't write to the conversation, so store this turn when the run finishes:
  // the user's message, then each message the run adds, which are the tool calls, their results,
  // and the answer. Agent Interface loads them when the thread is opened again. A failed or
  // stopped run isn't stored, and the browser's stream reports it.
  const turn = [messages[messages.length - 1]];
  runner.on("message", (message) => turn.push(message));
  runner.done().then(
    () =>
      storeChatCompletionHistory({ apiKey, conversationId: threadId, messages: turn }).catch(
        (error: unknown) =>
          console.error("Could not store the turn in the Gateway conversation.", error),
      ),
    () => {},
  );

  // The runner's stream carries every completion's chunks, one JSON object per line, and Agent
  // Interface reads it with openAIReadableStreamAdapter(). Creating it now means no chunk is missed
  // while the route waits below.
  const stream = runner.toReadableStream();

  // Wait for the first chunk, so a rejected key, rate limit, or unknown model returns as an HTTP
  // error with Gateway's message instead of failing mid-stream. Gateway reports some errors, such
  // as an unknown model, inside a successful response, so waiting for the response isn't enough.
  try {
    await Promise.race([runner.emitted("chunk"), runner.done()]);
  } catch (error) {
    const upstream = error as { status?: number; message?: string };
    return Response.json(
      { error: upstream.message ?? "OpenUI Gateway request failed." },
      { status: upstream.status ?? 502 },
    );
  }

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache, no-transform" },
  });
}
