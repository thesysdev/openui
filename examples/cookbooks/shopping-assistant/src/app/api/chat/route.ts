import { storeChatCompletionHistory } from "@openuidev/server/openai";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { loadChatCompletionHistory } from "../../../lib/gateway-history";
import { shopPrompt } from "../../../lib/prompt";
import { store } from "../../../lib/shopify";
import { executeSearchProducts, searchProductsTool } from "../../../lib/tools/search-products";
import { executeUpdateCart, updateCartTool } from "../../../lib/tools/update-cart";

export const runtime = "nodejs";

// The thread's earlier turns, loaded from its Gateway conversation with their tool calls and
// results rather than taken from the browser, so the model sees where each earlier answer came
// from. To send less of a long thread, compact the messages here.
function conversation(apiKey: string, threadId: string, signal: AbortSignal) {
  return loadChatCompletionHistory({ apiKey, conversationId: threadId, signal });
}

// Registers a function tool with runTools, which calls it with the model's arguments. runTools
// ends the run when a tool throws, so return the error as the tool's result instead.
function tool(
  definition: { function: { name: string; description: string; parameters: object } },
  execute: (args: string, options: { signal: AbortSignal }) => Promise<string>,
  signal: AbortSignal,
) {
  return {
    type: "function" as const,
    function: {
      ...definition.function,
      function: (args: string) =>
        execute(args, { signal }).catch((error: unknown) =>
          JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
        ),
    },
  };
}

export async function POST(request: Request) {
  // Agent Interface's storage creates the Gateway conversation first and sends its id as threadId.
  // The browser sends the whole thread; only its last message, the new question, is used.
  const { threadId, messages: sent } = (await request.json()) as {
    threadId?: string;
    messages?: ChatCompletionMessageParam[];
  };
  const question = sent?.at(-1);
  if (!threadId || question?.role !== "user")
    return Response.json(
      { error: "Send a threadId and the thread's messages, ending with the user's." },
      { status: 400 },
    );
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) throw new Error("Set THESYS_API_KEY in .env.local, then restart.");

  const gateway = new OpenAI({ apiKey, baseURL: "https://api.thesys.dev/v1/embed" });

  const thread = [...(await conversation(apiKey, threadId, request.signal)), question];
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: shopPrompt(store) },
    ...thread,
  ];

  // runTools requests a completion, runs the tools the model calls, sends their results back, and
  // repeats until the model answers. It runs only the tools registered here.
  const runner = gateway.chat.completions.runTools(
    {
      model: process.env.OPENUI_MODEL || "openai/gpt-5.5",
      messages,
      tools: [
        tool(searchProductsTool, executeSearchProducts, request.signal),
        tool(updateCartTool, executeUpdateCart, request.signal),
      ],
      max_completion_tokens: 6000,
      stream: true,
    },
    { signal: request.signal, maxChatCompletions: 6 },
  );

  // Chat Completions doesn't write to the conversation, so store this turn when the run ends: the
  // user's message, then each message the run adds, which are the tool calls, their results, and
  // the answer. Agent Interface loads them when the thread is opened again. A stopped or failed
  // run still stores the user's message and whatever finished before it ended.
  const turn: ChatCompletionMessageParam[] = [question];
  runner.on("message", (message) => turn.push(message));
  const stored = runner
    .done()
    .catch(() => {})
    .then(() => storeChatCompletionHistory({ apiKey, conversationId: threadId, messages: turn }))
    .catch((error: unknown) =>
      console.error("Could not store the turn in the Gateway conversation.", error),
    );

  // The runner's stream carries every completion's chunks, one JSON object per line, and Agent
  // Interface reads it with openAIReadableStreamAdapter(). It ends once the turn is stored, so a
  // follow-up loads it. Creating it now means no chunk is missed while the route waits below.
  const stream = runner.toReadableStream().pipeThrough(
    new TransformStream({
      async flush() {
        await stored;
      },
    }),
  );

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
