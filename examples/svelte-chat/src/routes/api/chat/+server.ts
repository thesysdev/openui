import { env } from "$env/dynamic/private";
import { library, promptOptions } from "$lib/library";
import { tools } from "$lib/tools";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText } from "ai";

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY ?? "" });

const systemPrompt = library.prompt(promptOptions);

export async function POST({ request }: { request: Request }) {
  const { messages } = await request.json();

  const result = streamText({
    model: openai("gpt-5.4"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
