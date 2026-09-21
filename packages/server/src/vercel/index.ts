import type { UIMessageChunk } from "ai";
import { createAutofix as createAutofixPipeline } from "../shared/create-autofix";
import type { AutofixOptions, AutofixStreamInput } from "../shared/types";
import { vercelAIAdapter } from "./adapter";

// Create validation and repair helpers for Vercel AI SDK UI message streams.
export function createAutofix(options: AutofixOptions) {
  const { fix, stream } = createAutofixPipeline(options, vercelAIAdapter);
  return {
    fix,
    ai: (input: AutofixStreamInput<UIMessageChunk>) => stream(input),
  };
}
