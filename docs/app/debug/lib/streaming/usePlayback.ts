"use client";

import { useCallback, useRef, useState } from "react";
import { normalizeResult } from "../parse";
import type { LoadedLangCore, ParseResult, StreamParserLike } from "../versions/types";
import { type ChunkStrategy, type StreamChunk, mulberry32, splitChunks } from "./chunker";

export interface TraceRow {
  i: number;
  chunkPreview: string;
  delayMs: number;
  rootPresent: boolean;
  rootAppeared: boolean;
  rootDropped: boolean;
  statementCount: number;
  incomplete: boolean;
  unresolvedCount: number;
  errorCount: number;
}

export type PlaybackStatus = "idle" | "playing" | "paused" | "done";

export interface PlaybackState {
  status: PlaybackStatus;
  /** Accumulated source text pushed so far — feed this to the Renderer. */
  prefix: string;
  chunkIndex: number;
  totalChunks: number;
  trace: TraceRow[];
  traceTruncated: boolean;
  result: ParseResult | null;
  /** Streaming result vs one-shot parse of the full source, checked on finish. */
  convergence: "converged" | "diverged" | null;
  /** True when the selected version has no createStreamingParser (re-parse per chunk). */
  emulated: boolean;
  fatal: string | null;
}

const IDLE: PlaybackState = {
  status: "idle",
  prefix: "",
  chunkIndex: 0,
  totalChunks: 0,
  trace: [],
  traceTruncated: false,
  result: null,
  convergence: null,
  emulated: false,
  fatal: null,
};

const TRACE_CAP = 5000;
const BASE_INTERVAL_MS = 40;

interface Session {
  /** Snapshot of the editor content when playback started. */
  source: string;
  chunks: StreamChunk[];
  strategy: ChunkStrategy;
  emulated: boolean;
  push: (chunk: string, prefix: string) => ParseResult;
  getFinal: () => ParseResult;
  prefix: string;
  index: number;
  lastRootPresent: boolean;
  rows: TraceRow[];
  truncated: boolean;
}

export interface PlaybackControls {
  state: PlaybackState;
  start: (opts: { strategy: ChunkStrategy; seed: number }) => void;
  pause: () => void;
  resume: () => void;
  step: () => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
  speed: number;
}

export function usePlayback(
  code: string,
  loaded: LoadedLangCore | null,
  schema: unknown,
  rootName: string | undefined,
): PlaybackControls {
  const [state, setState] = useState<PlaybackState>(IDLE);
  const [speed, setSpeedState] = useState(1);
  const speedRef = useRef(1);
  // Incremented on pause/reset/start — in-flight timeout callbacks bail when stale.
  const generation = useRef(0);
  const session = useRef<Session | null>(null);

  const setSpeed = useCallback((s: number) => {
    speedRef.current = s;
    setSpeedState(s);
  }, []);

  const finish = useCallback(
    (s: Session, l: LoadedLangCore) => {
      let convergence: PlaybackState["convergence"] = null;
      let fatal: string | null = null;
      let result: ParseResult | null = null;
      try {
        result = normalizeResult(s.getFinal());
        const oneShot = normalizeResult(l.mod.createParser!(schema, rootName).parse(s.source));
        convergence =
          JSON.stringify(result?.root) === JSON.stringify(oneShot?.root) ? "converged" : "diverged";
      } catch (err) {
        fatal = err instanceof Error ? err.message : String(err);
      }
      setState((prev) => ({
        ...prev,
        status: "done",
        result: result ?? prev.result,
        convergence,
        fatal,
      }));
    },
    [schema, rootName],
  );

  /** Parse one chunk, record a trace row, publish state. Returns false on fatal error. */
  const advance = useCallback((s: Session, status: PlaybackStatus): boolean => {
    const chunk = s.chunks[s.index];
    s.prefix += chunk.text;
    let result: ParseResult | null = null;
    let fatal: string | null = null;
    try {
      result = normalizeResult(s.push(chunk.text, s.prefix));
    } catch (err) {
      fatal = err instanceof Error ? err.message : String(err);
    }
    const rootPresent = !!result?.root;
    if (result) {
      if (s.rows.length >= TRACE_CAP) {
        s.truncated = true;
      } else {
        s.rows.push({
          i: s.index,
          chunkPreview: chunk.text.length > 40 ? `${chunk.text.slice(0, 40)}…` : chunk.text,
          delayMs: chunk.delayMs,
          rootPresent,
          rootAppeared: rootPresent && !s.lastRootPresent,
          rootDropped: !rootPresent && s.lastRootPresent,
          statementCount: result.meta.statementCount,
          incomplete: result.meta.incomplete,
          unresolvedCount: result.meta.unresolved.length,
          errorCount: result.meta.errors.length,
        });
      }
    }
    s.lastRootPresent = rootPresent;
    s.index += 1;
    setState({
      status: fatal ? "done" : status,
      prefix: s.prefix,
      chunkIndex: s.index,
      totalChunks: s.chunks.length,
      trace: [...s.rows],
      traceTruncated: s.truncated,
      result,
      convergence: null,
      emulated: s.emulated,
      fatal,
    });
    return !fatal;
  }, []);

  const play = useCallback(
    (s: Session, l: LoadedLangCore) => {
      const gen = generation.current;
      const tick = () => {
        if (generation.current !== gen || session.current !== s) return;
        if (s.index >= s.chunks.length) {
          finish(s, l);
          return;
        }
        if (!advance(s, "playing")) return;
        if (s.index >= s.chunks.length) {
          finish(s, l);
          return;
        }
        schedule();
      };
      const schedule = () => {
        const next = s.chunks[s.index];
        const base = s.strategy === "llm" && next ? next.delayMs : BASE_INTERVAL_MS;
        setTimeout(tick, Math.max(0, base / speedRef.current));
      };
      schedule();
    },
    [advance, finish],
  );

  const start = useCallback(
    ({ strategy, seed }: { strategy: ChunkStrategy; seed: number }) => {
      if (!loaded?.compatible || !loaded.mod.createParser || !code.trim()) return;
      generation.current += 1;

      const emulated = !loaded.capabilities.streaming;
      let push: Session["push"];
      let getFinal: Session["getFinal"];
      if (emulated) {
        // O(n²) full re-parse per chunk — fine at playground scale.
        let last: ParseResult | null = null;
        push = (_chunk, prefix) => {
          last = loaded.mod.createParser!(schema, rootName).parse(prefix);
          return last;
        };
        getFinal = () => last ?? loaded.mod.createParser!(schema, rootName).parse(code);
      } else {
        const sp: StreamParserLike = loaded.mod.createStreamingParser!(schema, rootName);
        push = (chunk) => sp.push(chunk);
        getFinal = () => sp.getResult();
      }

      const s: Session = {
        source: code,
        chunks: splitChunks(code, strategy, mulberry32(seed)),
        strategy,
        emulated,
        push,
        getFinal,
        prefix: "",
        index: 0,
        lastRootPresent: false,
        rows: [],
        truncated: false,
      };
      session.current = s;
      setState({ ...IDLE, status: "playing", totalChunks: s.chunks.length, emulated });
      play(s, loaded);
    },
    [code, loaded, schema, rootName, play],
  );

  const pause = useCallback(() => {
    generation.current += 1;
    setState((prev) => (prev.status === "playing" ? { ...prev, status: "paused" } : prev));
  }, []);

  const resume = useCallback(() => {
    const s = session.current;
    if (!s || !loaded) return;
    generation.current += 1;
    setState((prev) => (prev.status === "paused" ? { ...prev, status: "playing" } : prev));
    play(s, loaded);
  }, [loaded, play]);

  const step = useCallback(() => {
    const s = session.current;
    if (!s || !loaded) return;
    if (s.index >= s.chunks.length) {
      finish(s, loaded);
      return;
    }
    if (advance(s, "paused") && s.index >= s.chunks.length) finish(s, loaded);
  }, [advance, finish, loaded]);

  const reset = useCallback(() => {
    generation.current += 1;
    session.current = null;
    setState(IDLE);
  }, []);

  return { state, start, pause, resume, step, reset, setSpeed, speed };
}
