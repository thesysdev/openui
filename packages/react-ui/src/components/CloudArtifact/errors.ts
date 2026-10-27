import type { OpenUIError } from "@openuidev/react-lang";

/** Why an artifact, or its live data, can't be shown. */
export type ArtifactErrorCode = "not-found" | "generation-failed" | "network-error" | "tool-error";

/** An error the renderer reports, in the same shape as `Renderer`'s errors. */
export interface ArtifactError extends OpenUIError {
  source: "artifact" | "query";
  code: ArtifactErrorCode;
}

export function artifactError(
  code: Exclude<ArtifactErrorCode, "tool-error">,
  message: string,
): ArtifactError {
  return { source: "artifact", code, message };
}

export function toolError(toolName: string, message: string): ArtifactError {
  return { source: "query", code: "tool-error", message, toolName };
}
