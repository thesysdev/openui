import { generateSystemPrompt } from "@openuidev/lang-core";
import OpenAI from "openai";
import spec from "../generated/spec.json";
import type { ConversationTurn } from "./contract";

// A full OpenUI Lang prompt for the independent provider, not a gateway config block.
export const generationPrompt = generateSystemPrompt({ library: spec });

export async function* streamGeneration(
  messages: ConversationTurn[],
  options: {
    apiKey: string;
    model: string;
    baseURL?: string;
    signal: AbortSignal;
    fetcher?: typeof fetch;
  },
): AsyncGenerator<string> {
  const client = new OpenAI({
    apiKey: options.apiKey,
    baseURL: options.baseURL,
    fetch: options.fetcher,
    maxRetries: 0,
  });
  const stream = await client.chat.completions.create(
    {
      model: options.model,
      messages: [{ role: "system", content: generationPrompt }, ...messages],
      stream: true,
    },
    { signal: options.signal },
  );
  let completed = false;
  try {
    for await (const chunk of stream) {
      options.signal.throwIfAborted();
      const choice = chunk.choices[0];
      if (choice?.delta.refusal)
        throw new Error("The model could not generate this interface.");
      if (choice?.delta.content) yield choice.delta.content;
      if (choice?.finish_reason === "content_filter")
        throw new Error("The model could not generate this interface.");
      if (choice?.finish_reason) completed = true;
    }
    options.signal.throwIfAborted();
    if (!completed)
      throw new Error("The model stream ended before generation completed.");
  } finally {
    stream.controller.abort();
  }
}
