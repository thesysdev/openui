import { createConversations } from "../conversations/append";
import { resolveClientOptions, type ServerClientOptions } from "../shared/client";
import { createClientAutofix } from "../shared/client-autofix";
import { openAIAdapter } from "./adapter";
import { messagesToItems } from "./messages-to-items";
import { openAIResponsesAdapter } from "./responses-adapter";
import { responsesToItems } from "./responses-to-items";
import type { AppendMessagesInput } from "./types";

/** Configure OpenAI-format Autofix and conversation persistence. */
export function createServerClient(options: ServerClientOptions = {}) {
  const config = resolveClientOptions(options);
  return {
    autofix: {
      completions: createClientAutofix(config, openAIAdapter),
      responses: createClientAutofix(config, openAIResponsesAdapter),
    },
    conversations: createConversations(config, (input: AppendMessagesInput) =>
      input.format === "responses"
        ? responsesToItems(input.messages)
        : messagesToItems(input.messages),
    ),
  };
}

export type ServerClient = ReturnType<typeof createServerClient>;
