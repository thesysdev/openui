/**
 * Producer-side contract for the artifact lifecycle event this package emits on
 * `@openuidev/observability`. Intentionally duplicated (not imported) in
 * `@openuidev/observability-cloud` (src/events/artifact.ts), which consumes it;
 * the two packages have no dependency on each other. Keep the kind and the
 * detail shape in sync when changing either side.
 */
export const ARTIFACT_EVENT_KIND = "react-headless:artifact" as const;

/** Emitted once per stream lifecycle, when the artifact is shown or fails. */
export interface ArtifactEventDetail {
  /** One per lifecycle, across reconnects. */
  id: string;
  kind: typeof ARTIFACT_EVENT_KIND;
  artifactId: string;
  artifactType?: string;
  status: "complete" | "error";
  errorCode?: string;
  /** `stream` while generated or replayed; `get` for storages without `stream`. */
  source: "stream" | "get";
  /** From connecting to the first content. */
  timeToFirstDeltaMs?: number;
  durationMs: number;
  /** Reconnects after dropped connections. */
  reconnects: number;
  /** Attached with `Last-Event-ID`, after a previous connection. */
  resumed: boolean;
  /** Content was already on screen: an edit or a refresh. */
  edit: boolean;
  message: string;
}
