import { createAutofix as createAutofixPipeline } from "../shared/create-autofix";
import type { AutofixOptions } from "../shared/types";
import { openAIAdapter } from "./adapter";

export { AutofixError } from "../shared/types";
export type { AutofixResult, AutofixStream } from "../shared/types";

export {
  chatCompletionMessagesToItems,
  storeChatCompletionHistory,
} from "./store-conversation-items";
export type { AppendMessagesInput, StoreChatCompletionHistoryOptions } from "./types";

/** @deprecated Prefer the root createClient API. Existing calls remain supported. */
export function createAutofix(options: AutofixOptions) {
  return {
    completions: createAutofixPipeline(options, openAIAdapter),
  };
}
