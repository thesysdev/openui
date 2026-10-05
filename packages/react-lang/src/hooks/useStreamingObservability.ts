import type { OpenUIError, ParseResult } from "@openuidev/lang-core";
import { observability } from "@openuidev/observability";
import { useEffect, useRef } from "react";
import {
  STREAM_EVENT_KIND,
  STREAM_PHASE_SETTLED,
  STREAM_PHASE_STREAMING,
  type SettledStreamEventDetail,
  type StreamPhase,
} from "./streamEvent";

type CurrentRef<T> = { current: T };

export interface UseStreamingObservabilityOptions {
  response: string | null;
  isStreaming: boolean;
  result: ParseResult | null;
  errorsRef: CurrentRef<OpenUIError[]>;
  errorRevision: number;
  publish?: boolean;
  /** `createLibrary()` instance id, echoed on stream events for Debug matching. */
  __libraryId?: string;
}

export interface StreamingObservabilityState {
  id: string | null;
  updateIndex: number;
  lastResponse: string | null;
  hasPublishedStreamingSnapshot: boolean;
  settled: boolean;
  lastSettledErrorKey: string | null;
  /** Epoch ms when this stream first published. Frozen across later snapshots. */
  startedAt: number | null;
  /** Frozen once the stream first settles, so later error republishes don't grow it. */
  durationMs: number | null;
}

export interface StreamingObservabilityUpdate {
  id: string;
  phase: StreamPhase;
  updateIndex: number;
}

let fallbackId = 0;

function createStreamId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  fallbackId += 1;
  return `openui-lang-${Date.now().toString(36)}-${fallbackId.toString(36)}`;
}

export function createStreamingObservabilityState(): StreamingObservabilityState {
  return {
    id: null,
    updateIndex: 0,
    lastResponse: null,
    hasPublishedStreamingSnapshot: false,
    settled: false,
    lastSettledErrorKey: null,
    startedAt: null,
    durationMs: null,
  };
}

function captureStreamTiming(state: StreamingObservabilityState, now = Date.now()) {
  state.startedAt ??= now;
  if (state.settled) {
    state.durationMs ??= Math.max(0, now - state.startedAt);
  }
  const elapsedMs = state.durationMs ?? Math.max(0, now - state.startedAt);
  return {
    startedAt: state.startedAt,
    elapsedMs,
    ...(state.durationMs != null ? { durationMs: state.durationMs } : {}),
  };
}

/** Advances a Renderer through successive stream lifecycles. */
export function advanceStreamingObservability(
  state: StreamingObservabilityState,
  isStreaming: boolean,
  response: string | null,
  settledErrorKey: string | null = null,
  idFactory: () => string = createStreamId,
): StreamingObservabilityUpdate | null {
  if (isStreaming) {
    // A mounted Renderer can be reused for another message. Once the previous
    // stream has settled, the next streaming transition starts a new identity.
    if (state.settled) Object.assign(state, createStreamingObservabilityState());

    state.id ??= idFactory();
    if (state.hasPublishedStreamingSnapshot && state.lastResponse === response) return null;

    state.hasPublishedStreamingSnapshot = true;
    state.lastResponse = response;
    state.updateIndex += 1;
    return { id: state.id, phase: STREAM_PHASE_STREAMING, updateIndex: state.updateIndex };
  }

  // A Renderer mounted only for static or historical content never starts a stream.
  if (!state.id) return null;
  if (
    state.settled &&
    (settledErrorKey === null || state.lastSettledErrorKey === settledErrorKey)
  ) {
    return null;
  }

  state.updateIndex += 1;
  state.settled = true;
  state.lastSettledErrorKey = settledErrorKey;
  return { id: state.id, phase: STREAM_PHASE_SETTLED, updateIndex: state.updateIndex };
}

function parserMetadata(result: ParseResult | null) {
  if (!result) return undefined;
  return {
    incomplete: result.meta.incomplete,
    unresolved: result.meta.unresolved,
    orphaned: result.meta.orphaned,
    statementCount: result.meta.statementCount,
  };
}

function emitSettled(
  state: StreamingObservabilityState,
  update: StreamingObservabilityUpdate,
  response: string | null,
  result: ParseResult | null,
  errors: OpenUIError[],
  libraryIdFields: { __libraryId?: string },
) {
  observability(errors.length > 0 ? "error" : "info", {
    id: update.id,
    kind: STREAM_EVENT_KIND,
    phase: STREAM_PHASE_SETTLED,
    updateIndex: update.updateIndex,
    response,
    responseLength: response?.length ?? 0,
    parser: parserMetadata(result),
    errors,
    errorCount: errors.length,
    ...captureStreamTiming(state),
    ...libraryIdFields,
    message:
      errors.length > 0
        ? `OpenUI Lang settled with ${errors.length} error${errors.length === 1 ? "" : "s"}`
        : "OpenUI Lang settled",
  } satisfies SettledStreamEventDetail);
}

/**
 * Publishes the incremental OpenUI Lang stream lifecycle. The stable id is
 * created only after this Renderer instance has actually entered streaming.
 *
 * Switching chats unmounts the Renderer while `isStreaming` is still true, so
 * unmount also settles — otherwise DevTools stays on "Streaming" forever.
 */
export function useStreamingObservability({
  response,
  isStreaming,
  result,
  errorsRef,
  errorRevision,
  publish = true,
  __libraryId,
}: UseStreamingObservabilityOptions): void {
  const streamRef = useRef<StreamingObservabilityState>(createStreamingObservabilityState());
  const latestRef = useRef({
    publish,
    isStreaming,
    response,
    result,
    errorsRef,
    __libraryId,
  });
  latestRef.current = { publish, isStreaming, response, result, errorsRef, __libraryId };

  useEffect(() => {
    if (!publish) return;
    const errors = errorsRef.current;
    const settledErrorKey = isStreaming ? null : JSON.stringify(errors);
    const update = advanceStreamingObservability(
      streamRef.current,
      isStreaming,
      response,
      settledErrorKey,
    );
    const libraryIdFields = __libraryId !== undefined ? { __libraryId } : {};

    if (isStreaming) {
      if (update) {
        observability.info({
          id: update.id,
          kind: STREAM_EVENT_KIND,
          phase: update.phase,
          updateIndex: update.updateIndex,
          response,
          responseLength: response?.length ?? 0,
          parser: parserMetadata(result),
          ...captureStreamTiming(streamRef.current),
          ...libraryIdFields,
          message: "OpenUI Lang is streaming",
        });
      }
      return;
    }

    if (update?.phase === STREAM_PHASE_SETTLED) {
      emitSettled(streamRef.current, update, response, result, errors, libraryIdFields);
    }
  }, [publish, isStreaming, response, result, errorsRef, errorRevision, __libraryId]);

  useEffect(() => {
    return () => {
      const latest = latestRef.current;
      if (!latest.publish || !latest.isStreaming) return;
      const state = streamRef.current;
      if (!state.id || state.settled) return;
      const errors = latest.errorsRef.current;
      const update = advanceStreamingObservability(
        state,
        false,
        latest.response,
        JSON.stringify(errors),
      );
      if (update?.phase !== STREAM_PHASE_SETTLED) return;
      const libraryIdFields =
        latest.__libraryId !== undefined ? { __libraryId: latest.__libraryId } : {};
      emitSettled(state, update, latest.response, latest.result, errors, libraryIdFields);
    };
  }, []);
}
