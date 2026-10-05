import type { AutofixOptions } from "../shared/types";
import { createServerClient } from "./client";

export { ServerClientError } from "../shared/client";
export type { ServerClientOptions } from "../shared/client";
export type { ClientAutofixInput, ClientAutofixStreamInput } from "../shared/client-autofix";
export { AutofixError } from "../shared/types";
export type { AutofixResult, AutofixStream } from "../shared/types";
export { createServerClient } from "./client";
export type { ServerClient } from "./client";

export {
  chatCompletionMessagesToItems,
  storeChatCompletionHistory,
} from "./store-conversation-items";
export type { AppendMessagesInput, StoreChatCompletionHistoryOptions } from "./types";

/** @deprecated Use createServerClient().autofix.completions with a library per operation. */
export function createAutofix(options: AutofixOptions) {
  const { completions } = createServerClient(options).autofix;
  return {
    completions: {
      fix: (input: Omit<Parameters<typeof completions.fix>[0], "library">) =>
        completions.fix({ ...input, library: options.library }),
      stream: (input: Omit<Parameters<typeof completions.stream>[0], "library">) =>
        completions.stream({ ...input, library: options.library }),
    },
  };
}
