import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { createAutofix, type AutofixHelpers } from "../autofix/create-autofix";
import type { CreateAutofixParams } from "../autofix/types";
import type { CloudApi } from "../core/http";
import { openAIAdapter } from "./adapter";

/** Autofix for Chat Completions responses and streams. */
export interface ChatAutofix {
  completions: AutofixHelpers<ChatCompletionChunk>;
}

export const chatAutofix = (api: CloudApi, params: CreateAutofixParams): ChatAutofix => ({
  completions: createAutofix(api, params, openAIAdapter),
});
