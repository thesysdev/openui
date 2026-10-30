import type { ArtifactStreamError, ArtifactStreamErrorCode } from "@openuidev/react-headless";
import type { OpenUIError } from "@openuidev/react-lang";

/** Why an artifact can't be shown, with `source: "artifact"`. */
export type ArtifactError = ArtifactStreamError;
export type ArtifactErrorCode = ArtifactStreamErrorCode;

/** A failed data tool, in the same shape as `Renderer`'s query errors. */
export function toolError(toolName: string, message: string): OpenUIError {
  return { source: "query", code: "tool-error", message, toolName };
}
