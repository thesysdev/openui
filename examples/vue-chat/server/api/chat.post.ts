import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { tools } from "~/lib/tools";

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });

const systemPrompt = readFileSync(
  resolve(process.cwd(), "generated/system-prompt.txt"),
  "utf-8",
);

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event);

  const result = streamText({
    model: openai("gpt-4.1"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
});
