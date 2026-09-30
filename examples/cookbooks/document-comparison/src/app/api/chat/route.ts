import { storeChatCompletionHistory } from "@openuidev/server/openai";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { listDocuments, openDatabase } from "../../../lib/documents";
import { comparisonPrompt } from "../../../lib/prompt";
import { executeSearchDocuments, searchDocumentsTool } from "../../../lib/tools/search-documents";

export const runtime = "nodejs";

// Chat Completions keeps no state, so the browser sends the whole thread on every turn. Forward
// only user questions and assistant answers. Tool calls and results from the browser are dropped,
// so every passage the model cites comes from a search this server runs.
function conversation(messages: ChatCompletionMessageParam[]) {
  return messages.flatMap((message): ChatCompletionMessageParam[] =>
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content
      ? [{ role: message.role, content: message.content }]
      : [],
  );
}

export async function POST(request: Request) {
  // Agent Interface's storage creates the Gateway conversation first and sends its id as threadId.
  const { threadId, messages: thread } = (await request.json()) as {
    threadId?: string;
    messages?: ChatCompletionMessageParam[];
  };
  if (!threadId || thread?.at(-1)?.role !== "user")
    return Response.json(
      { error: "Send a threadId and the thread's messages, ending with the user's." },
      { status: 400 },
    );
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey || !process.env.OPENAI_API_KEY)
    throw new Error("Set THESYS_API_KEY and OPENAI_API_KEY in .env.local, then restart.");

  const db = openDatabase();
  const documents = listDocuments(db);
  db.close();

  const gateway = new OpenAI({ apiKey, baseURL: "https://api.thesys.dev/v1/embed" });
  const searchTool = searchDocumentsTool(documents);

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: comparisonPrompt(documents) },
    ...conversation(thread),
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

  // Chat Completions doesn't write to the conversation, so store this turn when the run ends: the
  // user's message, then each message the run adds, which are the tool calls, their results, and
  // the answer. Agent Interface loads them when the thread is opened again. A stopped or failed
  // run still stores the user's message and whatever finished before it ended.
  const turn = [messages[messages.length - 1]];
  runner.on("message", (message) => turn.push(message));
  runner
    .done()
    .catch(() => {})
    .then(() => storeChatCompletionHistory({ apiKey, conversationId: threadId, messages: turn }))
    .catch((error: unknown) =>
      console.error("Could not store the turn in the Gateway conversation.", error),
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
