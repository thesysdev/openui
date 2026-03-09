import { streamText } from "ai";
import type { ModelMessage } from "ai";
import { openai } from "@ai-sdk/openai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, systemPrompt } = (await req.json()) as {
    messages: ModelMessage[];
    systemPrompt?: string;
  };

  const result = streamText({
    model: openai("gpt-5.2"),
    system: systemPrompt,
    messages,
  });

  return result.toUIMessageStreamResponse();
}
