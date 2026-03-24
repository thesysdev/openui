import { OPENAI_API_KEY } from "$env/static/private";
import { tools } from "$lib/tools";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { readFileSync } from "fs";
import { join } from "path";

const openai = createOpenAI({ apiKey: OPENAI_API_KEY });

const systemPrompt = readFileSync(join(process.cwd(), "src/generated/system-prompt.txt"), "utf-8");

export async function POST({ request }: { request: Request }) {
  const { messages } = await request.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
