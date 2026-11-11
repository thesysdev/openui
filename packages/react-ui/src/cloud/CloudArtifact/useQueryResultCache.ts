// Query result cache: a reopened dashboard shows the result each query had last time, until the
// query answers again.
//
// 1. Saved: one entry per query in the artifact storage, under `<tool>::<arguments as JSON>`,
//    with the artifact version it was fetched for. Each result is saved as it arrives.
// 2. Every query makes exactly one real call. The calls a dashboard makes when it opens are
//    its "first batch"; only these can be answered from the saved results.
// 3. A first-batch call shows its saved result if that is here before the real one, and is
//    for the version on screen.
// 4. When a real result arrives, the queries run again on the next animation frame.
//    `Renderer` builds its query manager once, for one provider, so the provider is left
//    out for one render (`refreshing`). Each query is then answered from what was fetched,
//    or from its saved result again if its own call is still in flight.
// 5. Once nothing is in flight the first batch is over: every call is a plain real call.

import type { ArtifactStorage, InterpreterToolProvider } from "@openuidev/react-headless";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";

type ToolResult = Awaited<ReturnType<InterpreterToolProvider["callTool"]>>;

/** One data call of a run's first batch. */
interface FirstCall {
  real: Promise<ToolResult>;
  settled: boolean;
  /** The saved result the dashboard shows for it, until its own result replaces it. */
  shown?: ToolResult;
  /** The queries are running again: the next call for this key is answered from here. */
  replay: boolean;
}

/** One artifact version on screen. */
interface Run {
  id: string;
  version: string;
  /** The saved entries by key; one is used only if it is for this version. */
  saved: Promise<Record<string, unknown>>;
  /** True while the first batch runs; after it, every call is a real call. */
  firstBatch: boolean;
  calls: Map<string, FirstCall>;
  /** A call joined the first batch since the last flush. */
  joined: boolean;
  frame?: number;
}

/** The same key for the same tool and arguments, whatever the order of the argument keys. */
function queryKey(tool: string, args: unknown): string {
  const sorted = (_key: string, value: unknown) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => (a < b ? -1 : 1)))
      : value;
  return `${tool}::${JSON.stringify(args ?? {}, sorted)}`;
}

export function useQueryResultCache({
  toolProvider,
  storage,
  requestRef,
  showsContent,
}: {
  /** Makes the real calls. */
  toolProvider: InterpreterToolProvider;
  storage: ArtifactStorage | null | undefined;
  /** The artifact on screen. */
  requestRef: RefObject<{ id: string | null; version?: string }>;
  /** False for a card that does not render the dashboard. */
  showsContent: boolean;
}): { toolProvider: InterpreterToolProvider; refreshing: boolean } {
  const [refreshing, setRefreshing] = useState(false);
  useLayoutEffect(() => setRefreshing(false), [refreshing]);
  const runRef = useRef<Run | null>(null);
  const storageRef = useRef(storage);
  storageRef.current = storage;

  const queryResultCache = useMemo(() => {
    /** A refresh was asked for and the queries have not run again yet. */
    let awaitingRefresh = false;

    const provider: InterpreterToolProvider = {
      callTool(params) {
        const run = currentRun();
        if (!run?.firstBatch) return toolProvider.callTool(params);
        const key = queryKey(params.name, params.arguments);
        const call = run.calls.get(key);
        if (call?.replay) {
          call.replay = false;
          // Its own result if it is here, else what the dashboard showed for it.
          return !call.settled && call.shown ? Promise.resolve(call.shown) : call.real;
        }
        const real = toolProvider.callTool(params);
        // A repeated call is answered as without saved results.
        return call ? real : join(run, key, real);
      },
    };

    // Read on a run's first call, so a card that shows no content never reads.
    const currentRun = (): Run | null => {
      const { id, version } = requestRef.current;
      const store = storageRef.current;
      if (!id || !version || !store?.getQueryResults) return null;
      const run = runRef.current;
      if (run?.id === id && run.version === version) return run;
      dropRun();
      return (runRef.current = {
        id,
        version,
        saved: store.getQueryResults(id).catch(() => ({})),
        firstBatch: true,
        calls: new Map(),
        joined: false,
      });
    };

    const join = async (run: Run, key: string, real: Promise<ToolResult>): Promise<ToolResult> => {
      const call: FirstCall = { real, settled: false, replay: false };
      run.calls.set(key, call);
      run.joined = true;
      // Saved with the version the call was made with, also during an edit.
      const keep = ({ structuredContent: result }: ToolResult) => {
        if (result === undefined || JSON.stringify(result).length > 256 * 1024) return;
        const value = { version: run.version, result };
        storageRef.current?.putQueryResult?.(run.id, { key, value });
      };
      const settle = () => {
        call.settled = true;
        if (run === runRef.current) flushSoon(run);
      };
      // A result that cannot be kept must still settle the call.
      void real
        .then(keep)
        .catch(() => {})
        .then(settle);
      // The saved result if it is here before the real one settles: the real call never waits.
      const notFirst = () => null;
      const entries = await Promise.race([real.then(notFirst, notFirst), run.saved]);
      const saved = entries?.[key] as { version?: unknown; result?: unknown } | null | undefined;
      if (typeof saved !== "object" || saved?.version !== run.version) return real;
      return (call.shown = { content: [], structuredContent: saved.result });
    };

    const flush = (run: Run) => {
      run.frame = undefined;
      // `afterRefresh` flushes again once the queries have run.
      if (awaitingRefresh) return;
      const calls = [...run.calls.values()];
      // Not called in the last refresh: a later call for the key is a new, real call.
      for (const call of calls) call.replay = false;
      const replaced = calls.filter((call) => call.settled && call.shown);
      if (replaced.length > 0) {
        for (const call of replaced) call.shown = undefined;
        for (const call of calls) call.replay = true;
        awaitingRefresh = true;
        setRefreshing(true);
      } else if (calls.every((call) => call.settled)) {
        // A call that just joined may lead to more, such as a query that reads its result.
        if (run.joined) flushSoon(run);
        else {
          run.firstBatch = false;
          run.calls.clear();
        }
      }
      run.joined = false;
    };

    // Results that arrive in the same frame are handled together.
    const flushSoon = (run: Run) => {
      run.frame ??= requestAnimationFrame(() => flush(run));
    };

    const afterRefresh = () => {
      awaitingRefresh = false;
      if (runRef.current?.firstBatch) flushSoon(runRef.current);
    };

    const dropRun = () => {
      if (runRef.current?.frame !== undefined) cancelAnimationFrame(runRef.current.frame);
      runRef.current = null;
    };

    return { provider, afterRefresh, dropRun };
  }, [toolProvider, requestRef]);

  // The queries have run again (a child's effects run first).
  useEffect(() => {
    if (!refreshing) queryResultCache.afterRefresh();
  }, [refreshing, queryResultCache]);
  // Content shown again later is a new run: it reads the saved results again.
  useEffect(() => queryResultCache.dropRun, [showsContent, queryResultCache]);

  // A storage without saved results gets the original provider, untouched.
  return {
    toolProvider: storage?.getQueryResults ? queryResultCache.provider : toolProvider,
    refreshing,
  };
}
