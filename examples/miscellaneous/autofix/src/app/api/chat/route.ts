import spec from "@/generated/spec.json";
import { autofix } from "@/lib/autofix";
import { generateSystemPrompt } from "@openuidev/lang-core";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { messages } = (await request.json()) as {
    messages?: ChatCompletionMessageParam[];
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "messages must be a non-empty ChatCompletionMessageParam[]" },
      { status: 400 },
    );
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });
  
  const source = await openai.chat.completions.create(
    {
      model: process.env.OPENAI_MODEL ?? "gpt-5.5",
      messages: [
        { role: "system", content: generateSystemPrompt({ library: spec }) },
        ...messages,
      ],
      stream: true,
    },
    { signal: request.signal },
  );

  return autofix.completions
    .stream({ stream: source, messages, signal: request.signal })
    .toResponse();
}
