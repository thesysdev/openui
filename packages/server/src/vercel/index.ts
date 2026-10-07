import { createAutofix as createAutofixPipeline } from "../shared/create-autofix";
import type { AutofixOptions } from "../shared/types";
import { vercelAIAdapter } from "./adapter";
import { eveStreamAdapter } from "./eve-adapter";

export { AutofixError } from "../shared/types";
export type { AutofixResult, AutofixStream } from "../shared/types";

/** @deprecated Prefer the root createClient API. Existing calls remain supported. */
export function createAutofix(options: AutofixOptions) {
  return {
    ai: createAutofixPipeline(options, vercelAIAdapter),
    eve: createAutofixPipeline(options, eveStreamAdapter),
  };
}

export type { MessageStreamEvent as EveStreamEvent } from "eve/client";
