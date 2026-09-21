import { vercelAIAdapter } from "./autofix/adapters/vercel-ai-adapter";
import { createAutofix as createAutofixPipeline } from "./autofix/create-autofix";
import type { AutofixOptions } from "./autofix/types";

// Create validation and repair helpers for Vercel AI SDK UI message streams.
export function createAutofix(options: AutofixOptions) {
  return createAutofixPipeline(options, vercelAIAdapter);
}
