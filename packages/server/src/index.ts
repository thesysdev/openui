import { openAIAdapter } from "./openai/adapter";
import { createCompletionsConversations } from "./openai/client";
import { resolveClientOptions, type ClientOptions } from "./shared/client";
import { createClientAutofix, createClientFix } from "./shared/client-autofix";
import { vercelAIAdapter } from "./vercel/adapter";

export type { AppendMessagesInput } from "./openai/types";
export { ServerClientError } from "./shared/client";
export type { ClientOptions } from "./shared/client";
export type { ClientAutofixStreamInput, ClientFixInput } from "./shared/client-autofix";
export { AutofixError } from "./shared/types";
export type { AutofixResult, AutofixStream } from "./shared/types";

/** Configure once; library specs and request context belong to each operation. */
export function createClient(options: ClientOptions = {}) {
  const config = resolveClientOptions(options);
  return {
    autofix: createClientFix(config),
    openai: {
      completions: {
        autofix: { stream: createClientAutofix(config, openAIAdapter).stream },
        conversations: createCompletionsConversations(config),
      },
    },
    vercel: { ai: { autofix: { stream: createClientAutofix(config, vercelAIAdapter).stream } } },
  };
}

export type Client = ReturnType<typeof createClient>;
