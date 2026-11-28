import { standaloneApi } from "../autofix/create-autofix";
import type { AutofixOptions } from "../autofix/types";
import { aiAutofix, type AIAutofix } from "./autofix";

export { AutofixError } from "../autofix/types";
export type {
  AutofixDiagnostic,
  AutofixOptions,
  AutofixResult,
  AutofixStream,
} from "../autofix/types";
export type { AIAutofix } from "./autofix";

/**
 * Validation and repair helpers for Vercel AI SDK UI message streams.
 *
 * @deprecated Use `new OpenUIClient().ai.createAutofix({ library })`.
 */
export function createAutofix(options: AutofixOptions): { ai: AIAutofix } {
  return { ai: aiAutofix(standaloneApi(options), options) };
}
