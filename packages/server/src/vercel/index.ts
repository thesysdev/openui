import { createAutofix as createAutofixPipeline } from "../shared/create-autofix";
import type { AutofixOptions } from "../shared/types";
import { vercelAIAdapter } from "./adapter";
import { eveStreamAdapter } from "./eve-adapter";

export type { MessageStreamEvent as EveStreamEvent } from "eve/client";

// Create validation and repair helpers for Vercel AI SDK and Eve streams.
export function createAutofix(options: AutofixOptions) {
  return {
    ai: createAutofixPipeline(options, vercelAIAdapter),
    eve: createAutofixPipeline(options, eveStreamAdapter),
  };
}
