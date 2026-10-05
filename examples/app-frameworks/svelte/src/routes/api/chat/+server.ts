import { env } from "$env/dynamic/private";
import { library, promptOptions } from "$lib/library";
import { tools } from "$lib/tools";
import { createOpenAI } from "@ai-sdk/openai";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { convertToModelMessages, smoothStream, stepCountIs, streamText } from "ai";

const openai = createOpenAI({
  apiKey: env.THESYS_API_KEY ?? "",
  baseURL: "https://api.thesys.dev/v1/embed",
  // AI SDK always sends stream_options.include_usage; Cloud Completions
  // then withholds tokens until the stream ends. Drop it so deltas flush.
  fetch: (input, init) => {
    if (typeof init?.body === "string") {
      try {
        const body = JSON.parse(init.body) as { stream_options?: unknown };
        if (body.stream_options) {
          delete body.stream_options;
          init = { ...init, body: JSON.stringify(body) };
        }
      } catch {
        /* leave the body unchanged */
      }
    }
    return globalThis.fetch(input, init);
  },
});

const systemPrompt = generateSystemPrompt({
  cloud: true,
  library: library.toSpec(),
  promptOptions: {
    examples: promptOptions.examples,
    preamble: promptOptions.preamble,
    additionalRules: promptOptions.additionalRules,
  },
});

export async function POST({ request }: { request: Request }) {
  const { messages } = await request.json();

  const result = streamText({
    model: openai.chat("google/gemini-3.6-flash-free"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
    experimental_transform: smoothStream({ chunking: "line" }),
  });

  return result.toUIMessageStreamResponse({
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
