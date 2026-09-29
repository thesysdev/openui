import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { z } from "zod/v4";
import { bookingPrompt } from "../../../lib/prompt";
import { executeSearchStays, searchStaysTool, today } from "../../../lib/tools/search-stays";

export const runtime = "nodejs";

// Chat Completions keeps no state, so the browser sends the whole conversation on every turn.
// Forward only user messages and assistant answers. Tool calls and results from the browser
// are dropped, so every stay the model shows comes from a search this server runs.
// A submitted form arrives as the button label plus the form's values, so user messages can be
// longer than a typed question.
const chatRequestSchema = z.object({
  messages: z
    .array(
      z.discriminatedUnion("role", [
        z.object({ role: z.literal("user"), content: z.string().trim().min(1).max(4000) }),
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
  if (!reader) throw new Error("Send a message.");
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
      { error: "Send the conversation, ending with a message of up to 4,000 characters." },
      { status: 400 },
    );
  }
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey)
    return Response.json(
      {
        error:
          "Configure THESYS_API_KEY privately in .env.local and restart to use OpenUI Gateway.",
      },
      { status: 503 },
    );

  const gateway = new OpenAI({ apiKey, baseURL: "https://api.thesys.dev/v1/embed" });
  const searchTool = searchStaysTool();

  // runTools requests a completion, runs the tools the model calls, sends their results back, and
  // repeats until the model answers. It runs only the tools registered here.
  const runner = gateway.chat.completions.runTools(
    {
      model: process.env.OPENUI_MODEL || "openai/gpt-5.5",
      messages: [
        { role: "system", content: bookingPrompt(today()) },
        ...conversation(body.messages),
      ],
      tools: [
        {
          type: "function",
          function: {
            ...searchTool.function,
            // runTools ends the run when a tool throws, so return the error as the tool's result.
            function: (args: string) =>
              executeSearchStays(args, { signal: request.signal }).catch((error: unknown) =>
                JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
              ),
          },
        },
      ],
      max_completion_tokens: 6000,
      stream: true,
    },
    { signal: request.signal, maxChatCompletions: 3 },
  );

  // Forward the runner's completion chunks as server-sent events, the format Gateway streams, so
  // Agent Interface reads them with openAIAdapter(). The loop starts reading right away, so no
  // chunk is missed while the route waits below.
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of runner)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  // Wait for the first completion to start, so a rejected key or rate limit returns as an HTTP
  // error with Gateway's status instead of an event mid-stream.
  try {
    await Promise.race([runner.emitted("connect"), runner.done()]);
  } catch (error) {
    const upstream = error as { status?: number; message?: string };
    return Response.json(
      { error: upstream.message ?? "OpenUI Gateway request failed." },
      { status: upstream.status ?? 502 },
    );
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
