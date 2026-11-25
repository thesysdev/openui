import { standaloneApi } from "../autofix/create-autofix";
import type { AutofixOptions } from "../autofix/types";
import { vercelAutofix, type VercelAutofix } from "./autofix";

export { AutofixError } from "../autofix/types";
export type {
  AutofixDiagnostic,
  AutofixOptions,
  AutofixResult,
  AutofixStream,
} from "../autofix/types";
export type { VercelAutofix } from "./autofix";

/**
 * Validation and repair helpers for Vercel AI SDK UI message streams.
 *
 * @deprecated Use `new OpenUIClient().vercel.createAutofix({ library })`.
 */
export function createAutofix(options: AutofixOptions): VercelAutofix {
  return vercelAutofix(standaloneApi(options), options);
}
