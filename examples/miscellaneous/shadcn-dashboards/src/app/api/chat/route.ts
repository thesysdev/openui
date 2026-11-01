import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { ChatEvent } from "../../../lib/chat-events";
import { dashboardTools } from "../../../lib/dashboard-tools";
import { baseUrl } from "../../../lib/openui";
import { chatPrompt } from "../../../lib/prompt";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // The browser keeps the conversation and sends all of it, ending with the new request.
  const { messages } = (await request.json()) as { messages?: ChatCompletionMessageParam[] };
  if (!Array.isArray(messages) || messages.at(-1)?.role !== "user")
    return Response.json(
      { error: "Send the conversation, ending with the user's message." },
      { status: 400 },
    );
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) throw new Error("Set THESYS_API_KEY in .env.local, then restart.");

  const gateway = new OpenAI({ apiKey, baseURL: `${baseUrl}/v1/embed` });

  // runTools requests a completion, runs the dashboard tools the model calls, sends their results
  // back, and repeats until the model answers.
  const runner = gateway.chat.completions.runTools(
    {
      model: process.env.OPENUI_MODEL || "openai/gpt-5.5",
      messages: [{ role: "system", content: chatPrompt }, ...messages],
      tools: dashboardTools(request.signal),
      max_completion_tokens: 2000,
      stream: true,
    },
    { signal: request.signal, maxChatCompletions: 4 },
  );

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: ChatEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      const turn: ChatCompletionMessageParam[] = [];
      const toolNames = new Map<string, string>();

      runner.on("content", (delta) => send({ type: "text", delta }));
      runner.on("message", (message) => {
        turn.push(message);
        if (message.role === "assistant")
          for (const call of message.tool_calls ?? [])
            if (call.type === "function") toolNames.set(call.id, call.function.name);
        // Both tools return the dashboard's response, or an error the model explains instead.
        if (message.role === "tool" && typeof message.content === "string")
          send({
            type: "dashboard",
            tool: toolNames.get(message.tool_call_id) ?? "",
            response: message.content,
          });
      });
      runner
        .done()
        .then(
          () => send({ type: "done", messages: turn }),
          (error: unknown) =>
            send({
              type: "error",
              message: error instanceof Error ? error.message : String(error),
            }),
        )
        .finally(() => controller.close())
        .catch(() => {}); // The browser went away.
    },
  });

  // Wait for the first chunk, so a rejected key, rate limit, or unknown model returns as an HTTP
  // error with Gateway's message instead of failing mid-stream.
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
