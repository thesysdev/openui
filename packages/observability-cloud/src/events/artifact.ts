import type { ObservabilityEvent } from "@openuidev/observability";
import type { WireEventBase } from "../core/wire";

/**
 * Consumer side of the artifact lifecycle event that `@openuidev/react-headless`
 * emits (src/cloud/artifactEvent.ts): one per artifact stream, when the
 * artifact is shown or fails. Intentionally duplicated, not imported; keep the
 * kind and the detail fields in sync with the producer.
 */
export const ARTIFACT_EVENT_KIND = "react-headless:artifact" as const;
export type ArtifactEventKind = typeof ARTIFACT_EVENT_KIND;

/** Wire shape for artifact lifecycle events sent to cloud ingest. */
export interface ArtifactWireEvent extends WireEventBase {
  kind: ArtifactEventKind;
  artifactId: string;
  artifactType?: string;
  status: "complete" | "error";
  errorCode?: string;
  /** `stream` while generated or replayed; `get` for storages without streaming. */
  source: "stream" | "get";
  timeToFirstDeltaMs?: number;
  durationMs: number;
  reconnects: number;
  resumed: boolean;
  edit: boolean;
  /** Full capture only. */
  message?: string;
}

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/**
 * Returns a wire event when `event` is an artifact lifecycle event; otherwise
 * null. Minimal capture drops the free-text `message`.
 */
export function selectArtifactEvent(
  event: ObservabilityEvent,
  capture: "full" | "minimal",
): ArtifactWireEvent | null {
  const { detail } = event;
  if (detail["kind"] !== ARTIFACT_EVENT_KIND) return null;

  const id = detail["id"];
  const artifactId = detail["artifactId"];
  const status = detail["status"];
  const source = detail["source"];
  const durationMs = detail["durationMs"];
  const reconnects = detail["reconnects"];
  if (
    typeof id !== "string" ||
    typeof artifactId !== "string" ||
    (status !== "complete" && status !== "error") ||
    (source !== "stream" && source !== "get") ||
    !isNumber(durationMs) ||
    !isNumber(reconnects)
  ) {
    return null;
  }

  const artifactType = detail["artifactType"];
  const errorCode = detail["errorCode"];
  const timeToFirstDeltaMs = detail["timeToFirstDeltaMs"];
  const message = detail["message"];

  return {
    id,
    kind: ARTIFACT_EVENT_KIND,
    level: event.level,
    timestamp: event.timestamp,
    artifactId,
    ...(typeof artifactType === "string" ? { artifactType } : {}),
    status,
    ...(typeof errorCode === "string" ? { errorCode } : {}),
    source,
    ...(isNumber(timeToFirstDeltaMs) ? { timeToFirstDeltaMs } : {}),
    durationMs,
    reconnects,
    resumed: detail["resumed"] === true,
    edit: detail["edit"] === true,
    ...(capture === "full" && typeof message === "string" ? { message } : {}),
  };
}
