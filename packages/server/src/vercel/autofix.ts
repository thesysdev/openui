import type { UIMessageChunk } from "ai";
import { createAutofix, type AutofixHelpers } from "../autofix/create-autofix";
import type { CreateAutofixParams } from "../autofix/types";
import type { CloudApi } from "../core/http";
import { vercelAIAdapter } from "./adapter";

/** Autofix for Vercel AI SDK responses and UI message streams. */
export interface AIAutofix {
  ai: AutofixHelpers<UIMessageChunk>;
}

export const aiAutofix = (api: CloudApi, params: CreateAutofixParams): AIAutofix => ({
  ai: createAutofix(api, params, vercelAIAdapter),
});
