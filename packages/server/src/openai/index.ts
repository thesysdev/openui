import { standaloneApi } from "../autofix/create-autofix";
import type { AutofixOptions } from "../autofix/types";
import { openAIAutofix, type OpenAIAutofix } from "./autofix";

export { AutofixError } from "../autofix/types";
export type {
  AutofixDiagnostic,
  AutofixOptions,
  AutofixResult,
  AutofixStream,
} from "../autofix/types";
export type { OpenAIAutofix } from "./autofix";
export {
  chatCompletionMessagesToItems,
  storeChatCompletionHistory,
} from "./store-conversation-items";
export type { StoreChatCompletionHistoryOptions } from "./store-conversation-items";

/**
 * Validation and repair helpers for Chat Completions.
 *
 * @deprecated Use `new OpenUIClient().openai.createAutofix({ library })`.
 */
export function createAutofix(options: AutofixOptions): OpenAIAutofix {
  return openAIAutofix(standaloneApi(options), options);
}
