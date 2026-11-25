import { createAutofix as createAutofixPipeline } from "../autofix/create-autofix";
import type { AutofixOptions } from "../autofix/types";
import { vercelAIAdapter } from "./adapter";

// Create validation and repair helpers for Vercel AI SDK UI message streams.
export function createAutofix(options: AutofixOptions) {
  return {
    ai: createAutofixPipeline(options, vercelAIAdapter),
  };
}
