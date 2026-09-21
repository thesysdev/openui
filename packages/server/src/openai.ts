import { openAIAdapter } from "./autofix/adapters/openai-adapter";
import { createAutofix as createAutofixPipeline } from "./autofix/create-autofix";
import type { AutofixOptions } from "./autofix/types";

// Create validation and repair helpers for OpenAI Chat Completions streams.
export function createAutofix(options: AutofixOptions) {
  return createAutofixPipeline(options, openAIAdapter);
}
