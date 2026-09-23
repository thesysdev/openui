import { createAutofix as createAutofixPipeline } from "../shared/create-autofix";
import type { AutofixOptions } from "../shared/types";
import { openAIAdapter } from "./adapter";
import { openAIResponsesAdapter } from "./responses-adapter";

export {
  chatCompletionMessagesToItems,
  storeChatCompletionHistory,
} from "./store-conversation-items";
export type { StoreChatCompletionHistoryOptions } from "./types";

// Create validation and repair helpers for OpenAI Chat Completions and Responses.
export function createAutofix(options: AutofixOptions) {
  return {
    completions: createAutofixPipeline(options, openAIAdapter),
    responses: createAutofixPipeline(options, openAIResponsesAdapter),
  };
}
