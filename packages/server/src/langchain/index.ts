import { createAutofix as createAutofixPipeline } from "../shared/create-autofix";
import type { AutofixOptions } from "../shared/types";
import { langGraphAdapter } from "./adapter";

export { AutofixError } from "../shared/types";
export type { AutofixResult, AutofixStream } from "../shared/types";
export type { LangGraphStreamEvent } from "./types";

/** @deprecated Prefer client.langgraph.autofix.stream from the root createClient API. */
export function createAutofix(options: AutofixOptions) {
  return { langgraph: createAutofixPipeline(options, langGraphAdapter) };
}
