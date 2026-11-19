/**
 * Producer-side contract for the stream lifecycle events this package emits on
 * `@openuidev/observability`. Intentionally duplicated (not imported) in
 * `@openuidev/observability-cloud` (src/events/stream.ts), which consumes these
 * events; the two packages have no dependency on each other. Keep the string
 * constants and the settled detail shape in sync when changing either side.
 */
export const STREAM_EVENT_KIND = "react-lang:stream" as const;
export type StreamEventKind = typeof STREAM_EVENT_KIND;

export const STREAM_PHASE_STREAMING = "streaming" as const;
export const STREAM_PHASE_SETTLED = "settled" as const;
/** The Renderer unmounted while streaming, so the stream will never settle. */
export const STREAM_PHASE_UNMOUNTED = "unmounted" as const;
export type StreamPhase =
  typeof STREAM_PHASE_STREAMING | typeof STREAM_PHASE_SETTLED | typeof STREAM_PHASE_UNMOUNTED;

export interface StreamParserMetadata {
  incomplete: boolean;
  unresolved: unknown;
  orphaned: unknown;
  statementCount: number;
}

/** Detail payload emitted when a stream settles. */
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
}
