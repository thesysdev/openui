import librarySpec from "@/generated/spec.json";
import { promptOptions } from "@/lib/prompt-options";
import { getWeather, WEATHER_TOOL_DESCRIPTION } from "@/lib/tools/get-weather";
import { createOpenAI } from "@ai-sdk/openai";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";

export const runtime = "nodejs";

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

const tools = {
  get_weather: tool({
    description: WEATHER_TOOL_DESCRIPTION,
    inputSchema: z.object({
      location: z.string().trim().min(1).describe("City or place name, e.g. Berlin."),
    }),
    execute: ({ location }, { abortSignal }) => getWeather(location, { signal: abortSignal }),
  }),
};

export async function POST(req: Request) {
  const payload = (await req.json()) as { messages?: UIMessage[] };
  if (!Array.isArray(payload.messages)) {
    return Response.json({ error: "messages must be an array" }, { status: 400 });
  }

  const result = streamText({
    model: openai.chat(process.env.OPENAI_MODEL ?? "gpt-5.2"),
    system: generateSystemPrompt({ library: librarySpec, promptOptions }),
    messages: await convertToModelMessages(payload.messages),
    tools,
    stopWhen: stepCountIs(5),
    abortSignal: req.signal,
  });

  // Preserve the AI SDK's native UIMessage stream. The frontend adapter uses
  // the AI SDK itself to decode it before mapping chunks into OpenUI events.
  return result.toUIMessageStreamResponse();
}
