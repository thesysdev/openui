import librarySpec from "@/generated/spec.json";
import { promptOptions } from "@/lib/prompt-options";
import { getWeather, WEATHER_TOOL_DESCRIPTION } from "@/lib/tools/get-weather";
import { generateSystemPrompt } from "@openuidev/lang-core";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const client = new OpenAI();

// The browser keeps each tool call but never receives its result, so earlier
// turns are sent to the model as text only.
function withoutToolCalls(messages: ChatCompletionMessageParam[]): ChatCompletionMessageParam[] {
  return messages.flatMap((message): ChatCompletionMessageParam[] => {
    if (message.role === "tool") return [];
    if (message.role !== "assistant") return [message];
    if (!message.content) return [];
    return [{ role: "assistant", content: message.content }];
  });
}

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as {
      messages: ChatCompletionMessageParam[];
    };

    // runTools() calls the model, runs the tools it asks for, sends the
    // results back, and repeats until the model answers.
    const runner = client.chat.completions.runTools(
      {
        model: process.env.OPENAI_MODEL ?? "gpt-5.2",
        messages: [
          {
            role: "system",
            content: generateSystemPrompt({
              library: librarySpec,
              promptOptions,
            }),
          },
          ...withoutToolCalls(messages),
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "get_weather",
              description: WEATHER_TOOL_DESCRIPTION,
              parameters: {
                type: "object",
                properties: {
                  location: { type: "string", description: "City or place name, e.g. Berlin." },
                },
                required: ["location"],
                additionalProperties: false,
              },
              parse: (args: string) => JSON.parse(args) as { location: string },
              function: async ({ location }: { location: string }) =>
                JSON.stringify(await getWeather(location, { signal: req.signal })),
            },
          },
        ],
        stream: true,
      },
      { signal: req.signal, maxChatCompletions: 5 }, // propagate browser aborts
    );

    // NDJSON stream of every completion's chunks — the client parses it with
    // openAIReadableStreamAdapter().
    const stream = runner.toReadableStream();

    // Surface upstream failures (bad key, unknown model) as an HTTP error.
    await Promise.race([runner.emitted("chunk"), runner.done()]);

    return new Response(stream, {
      headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
