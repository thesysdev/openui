import { createAutofix as createAutofixPipeline, standaloneApi } from "../autofix/create-autofix";
import type { AutofixOptions } from "../autofix/types";
import { openAIAdapter } from "./adapter";

export {
  chatCompletionMessagesToItems,
  storeChatCompletionHistory,
} from "./store-conversation-items";
export type { StoreChatCompletionHistoryOptions } from "./store-conversation-items";

// Create validation and repair helpers for OpenAI Chat Completions and Responses.
export function createAutofix(options: AutofixOptions) {
  return {
    completions: createAutofixPipeline(standaloneApi(options), options, openAIAdapter),
  };
}
