import { standaloneApi } from "../autofix/create-autofix";
import type { AutofixOptions } from "../autofix/types";
import { chatAutofix, type ChatAutofix } from "./autofix";

export { AutofixError } from "../autofix/types";
export type {
  AutofixDiagnostic,
  AutofixOptions,
  AutofixResult,
  AutofixStream,
} from "../autofix/types";
export type { ChatAutofix } from "./autofix";
export {
  chatCompletionMessagesToItems,
  storeChatCompletionHistory,
} from "./store-conversation-items";
export type { StoreChatCompletionHistoryOptions } from "./store-conversation-items";

/**
 * Validation and repair helpers for Chat Completions.
 *
 * @deprecated Use `new OpenUIClient().chat.createAutofix({ library })`.
 */
export function createAutofix(options: AutofixOptions): { completions: ChatAutofix } {
  return { completions: chatAutofix(standaloneApi(options), options) };
}
