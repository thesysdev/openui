import { createAutofix as createAutofixPipeline } from "../shared/create-autofix";
import type { AutofixOptions } from "../shared/types";
import { openAIAdapter } from "./adapter";

export {
  chatCompletionMessagesToItems,
  storeChatCompletionHistory,
} from "./store-conversation-items";
export type { StoreChatCompletionHistoryOptions } from "./types";

// Create validation and repair helpers for OpenAI Chat Completions streams.
export function createAutofix(options: AutofixOptions) {
  return createAutofixPipeline(options, openAIAdapter);
}
