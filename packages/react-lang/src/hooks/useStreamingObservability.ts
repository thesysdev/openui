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
  /** LLM run that produced this stream. Groups Inspect events with the request/response pair. */
  runId?: string;
  /** Display title for the Inspect run group. */
  runTitle?: string;
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
    // Same content flipping back to streaming is not a new run — that happens
    // when a historical assistant is marked live because a new user turn started.
    if (state.settled && state.lastResponse === response) return null;
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

/**
 * Publishes the incremental OpenUI Lang stream lifecycle. The stable id is
 * created only after this Renderer instance has actually entered streaming.
 */
export function useStreamingObservability({
  response,
  isStreaming,
  result,
  errorsRef,
  errorRevision,
  publish = true,
  __libraryId,
  runId,
  runTitle,
}: UseStreamingObservabilityOptions): void {
  const streamRef = useRef<StreamingObservabilityState>(createStreamingObservabilityState());
  const runIdRef = useRef(runId);

  useEffect(() => {
    if (!publish) return;
    if (runIdRef.current !== runId) {
      Object.assign(streamRef.current, createStreamingObservabilityState());
      runIdRef.current = runId;
    }
    const errors = errorsRef.current;
    const settledErrorKey = isStreaming ? null : JSON.stringify(errors);
    const update = advanceStreamingObservability(
      streamRef.current,
      isStreaming,
      response,
      settledErrorKey,
    );
    const libraryIdFields = __libraryId !== undefined ? { __libraryId } : {};
    const runFields = {
      ...(runId !== undefined ? { runId } : {}),
      ...(runTitle !== undefined ? { runTitle } : {}),
    };

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
          ...runFields,
          message: "OpenUI Lang is streaming",
        });
      }
      return;
    }

    if (update?.phase === STREAM_PHASE_SETTLED) {
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
        ...captureStreamTiming(streamRef.current),
        ...libraryIdFields,
        ...runFields,
        message:
          errors.length > 0
            ? `OpenUI Lang settled with ${errors.length} error${errors.length === 1 ? "" : "s"}`
            : "OpenUI Lang settled",
      } satisfies SettledStreamEventDetail);
    }
  }, [
    publish,
    isStreaming,
    response,
    result,
    errorsRef,
    errorRevision,
    __libraryId,
    runId,
    runTitle,
  ]);
}
