import { createOpenAI } from "@ai-sdk/openai";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { createOpenUILibrary, promptOptions } from "~/lib/define-library";
import { tools } from "~/lib/tools";

const openai = createOpenAI({
  apiKey: process.env.THESYS_API_KEY ?? "",
  baseURL: "https://api.thesys.dev/v1/embed",
});

const specLibrary = createOpenUILibrary();

const systemPrompt = generateSystemPrompt({
  cloud: true,
  library: specLibrary.toSpec(),
  promptOptions: {
    examples: promptOptions.examples,
    preamble: promptOptions.preamble,
    additionalRules: promptOptions.additionalRules,
  },
});

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event);

  const result = streamText({
    model: openai.chat("google/gemini-3.6-flash-free"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
});
