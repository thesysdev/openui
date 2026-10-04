import librarySpec from "@/generated/spec.json";
import { promptOptions } from "@/lib/prompt-options";
import { generateSystemPrompt } from "@openuidev/lang-core";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const client = new OpenAI();

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as {
      messages: ChatCompletionMessageParam[];
    };

    // .asResponse() forwards the SDK's raw SSE response untouched — the client
    // parses it with openAIAdapter().
    return await client.chat.completions
      .create(
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
            ...messages,
          ],
          stream: true,
        },
        { signal: req.signal }, // propagate browser aborts
      )
      .asResponse();
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
