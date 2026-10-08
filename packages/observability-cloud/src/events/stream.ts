import type { ObservabilityEvent } from "@openuidev/observability";
import type { WireEventBase } from "../core/wire";

/**
 * Shared producer↔sink contract for stream lifecycle events. The hook
 * (src/hooks/useStreamingObservability.ts) builds event details against this
 * module, and selectStreamEvent filters against the same constants, so the two
 * sides cannot silently drift.
 */
export const STREAM_EVENT_KIND = "react-lang:stream" as const;
export type StreamEventKind = typeof STREAM_EVENT_KIND;

export const STREAM_PHASE_STREAMING = "streaming" as const;
export const STREAM_PHASE_SETTLED = "settled" as const;
export type StreamPhase = typeof STREAM_PHASE_STREAMING | typeof STREAM_PHASE_SETTLED;

const MAX_RESPONSE_LENGTH = 16_384;

export interface StreamParserMetadata {
  incomplete: boolean;
  /** Identifiers referenced but never defined in the generated program. */
  unresolved: string[];
  /** Identifiers defined but not reachable from root. */
  orphaned: string[];
  statementCount: number;
}

/**
 * One error from a settled render, as shipped to ingest. `code`/`source` are
 * required and enum-like; the rest are optional identifiers. `message` is
 * free text and is stripped in minimal capture.
 */
export interface WireErrorEntry {
  code: string;
  source: string;
  component?: string;
  statementId?: string;
  toolName?: string;
  message?: string;
}

/** Detail payload the producer emits when a stream settles. */
export interface SettledStreamEventDetail {
  id: string;
  kind: StreamEventKind;
  phase: typeof STREAM_PHASE_SETTLED;
  updateIndex: number;
  response: string | null;
  responseLength: number;
  parser?: StreamParserMetadata;
  errors: unknown[];
  errorCount: number;
  message: string;
  /** `createLibrary()` instance id for the Renderer that produced this stream. */
  __libraryId?: string;
  /** LLM run that produced this stream. Matches `LLM:*` events from the chat store. */
  runId?: string;
  /** Display title for the Inspect run group. */
  runTitle?: string;
}

/** Wire shape for settled stream events sent to cloud ingest. */
export interface StreamWireEvent extends WireEventBase {
  kind: StreamEventKind;
  updateIndex: number;
  errorCount: number;
  parser?: StreamParserMetadata;
  response?: string;
  responseTruncated?: true;
  message?: string;
  errors?: WireErrorEntry[];
}

function isStreamParserMetadata(value: unknown): value is StreamParserMetadata {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record["incomplete"] === "boolean" &&
    Array.isArray(record["unresolved"]) &&
    Array.isArray(record["orphaned"]) &&
    typeof record["statementCount"] === "number"
  );
}

const OPTIONAL_ERROR_KEYS = ["component", "statementId", "toolName"] as const;

/**
 * Projects the producer's error list onto the wire shape. Entries without a
 * string `code` and `source` are dropped; `errorCount` on the wire is the
 * length of the result, so the count always matches the list.
 */
function projectErrors(raw: unknown, capture: "full" | "minimal"): WireErrorEntry[] {
  if (!Array.isArray(raw)) return [];
  const projected: WireErrorEntry[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const code = record["code"];
    const source = record["source"];
    if (typeof code !== "string" || typeof source !== "string") continue;
    const wire: WireErrorEntry = { code, source };
    for (const key of OPTIONAL_ERROR_KEYS) {
      const value = record[key];
      if (typeof value === "string") wire[key] = value;
    }
    if (capture === "full" && typeof record["message"] === "string") {
      wire.message = record["message"];
    }
    projected.push(wire);
  }
  return projected;
}

/**
 * Returns a wire event when `event` is a settled stream event the cloud sink
 * should keep; otherwise null. Kind filtering, validation, and capture shaping
 * all live here so the shared selector stays kind-agnostic.
 */
export function selectStreamEvent(
  event: ObservabilityEvent,
  capture: "full" | "minimal",
): StreamWireEvent | null {
  const { detail } = event;
  if (detail["kind"] !== STREAM_EVENT_KIND || detail["phase"] !== STREAM_PHASE_SETTLED) return null;

  const id = detail["id"];
  if (typeof id !== "string") return null;

  const updateIndex = detail["updateIndex"];
  if (typeof updateIndex !== "number" || typeof detail["errorCount"] !== "number") return null;

  const parser = isStreamParserMetadata(detail["parser"]) ? detail["parser"] : undefined;
  const errors = projectErrors(detail["errors"], capture);
  const errorCount = errors.length;

  if (capture === "minimal") {
    return {
      id,
      kind: STREAM_EVENT_KIND,
      level: event.level,
      timestamp: event.timestamp,
      updateIndex,
      errorCount,
      ...(parser ? { parser } : {}),
      ...(errors.length > 0 ? { errors } : {}),
    };
  }

  const response = typeof detail["response"] === "string" ? detail["response"] : undefined;
  let responseTruncated: true | undefined;
  let truncatedResponse = response;
  if (response && response.length > MAX_RESPONSE_LENGTH) {
    truncatedResponse = response.slice(0, MAX_RESPONSE_LENGTH);
    responseTruncated = true;
  }

  return {
    id,
    kind: STREAM_EVENT_KIND,
    level: event.level,
    timestamp: event.timestamp,
    updateIndex,
    errorCount,
    ...(parser ? { parser } : {}),
    ...(truncatedResponse !== undefined ? { response: truncatedResponse } : {}),
    ...(responseTruncated ? { responseTruncated } : {}),
    ...(typeof detail["message"] === "string" ? { message: detail["message"] } : {}),
    ...(errors.length > 0 ? { errors } : {}),
  };
}
