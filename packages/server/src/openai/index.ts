import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { createAutofix as createAutofixPipeline } from "../shared/create-autofix";
import type { AutofixOptions, AutofixStreamInput } from "../shared/types";
import { openAIAdapter } from "./adapter";

export {
  chatCompletionMessagesToItems,
  storeChatCompletionHistory,
} from "./store-conversation-items";
export type { StoreChatCompletionHistoryOptions } from "./types";

// Create validation and repair helpers for OpenAI Chat Completions and Responses.
export function createAutofix(options: AutofixOptions) {
  const { fix, stream } = createAutofixPipeline(options, openAIAdapter);
  return {
    fix,
    chat: {
      completions: (input: AutofixStreamInput<ChatCompletionChunk>) => stream(input),
    },
  };
}
