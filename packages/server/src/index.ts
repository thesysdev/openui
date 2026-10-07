import { langGraphAdapter } from "./langchain/adapter";
import { openAIAdapter } from "./openai/adapter";
import { createCompletionsConversations } from "./openai/client";
import { openAIResponsesAdapter } from "./openai/responses-adapter";
import { resolveClientOptions, type ClientOptions } from "./shared/client";
import { createClientAutofix, createClientFix } from "./shared/client-autofix";
import { createTools } from "./tools/execute";
import { vercelAIAdapter } from "./vercel/adapter";
import { eveStreamAdapter } from "./vercel/eve-adapter";

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
    tools: createTools(config),
    autofix: createClientFix(config),
    openai: {
      completions: {
        autofix: { stream: createClientAutofix(config, openAIAdapter).stream },
        conversations: createCompletionsConversations(config),
      },
      responses: {
        autofix: { stream: createClientAutofix(config, openAIResponsesAdapter).stream },
      },
    },
    langchain: {
      langgraph: { autofix: { stream: createClientAutofix(config, langGraphAdapter).stream } },
    },
    vercel: {
      ai: { autofix: { stream: createClientAutofix(config, vercelAIAdapter).stream } },
      eve: { autofix: { stream: createClientAutofix(config, eveStreamAdapter).stream } },
    },
  };
}

export type Client = ReturnType<typeof createClient>;

export type { MessageStreamEvent as EveStreamEvent } from "eve/client";
export type { LangGraphStreamEvent } from "./langchain/types";

export type { ExecuteToolInput, ToolArtifactRef, ToolExecutor } from "./tools/types";
