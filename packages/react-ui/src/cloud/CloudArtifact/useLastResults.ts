// Last results: a reopened dashboard shows the result each query had last time, until the
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
// 5. Once nothing is in flight the first batch is over: every call is a plain real call,
//    whose result is saved too.
// 6. The dashboard's state (its filters) is one more entry, saved shortly after it changes.
//    On open the program is held back until it is read, so the first batch runs with it.

import type { ArtifactStorage, InterpreterToolProvider } from "@openuidev/react-headless";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";

type ToolResult = Awaited<ReturnType<InterpreterToolProvider["callTool"]>>;
type State = Record<string, unknown>;

/** The state's entry: query keys always contain `::`, so this is never one. */
const STATE_KEY = "$state";
/** Opening waits this long for the saved entries, then starts on the default state. */
const READ_WAIT_MS = 400;
/** The state is saved this long after its last change. */
const SAVE_STATE_AFTER_MS = 500;

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

export function useLastResults({
  toolProvider,
  storage,
  requestRef,
  showsContent,
  hasProgram,
}: {
  /** Makes the real calls. */
  toolProvider: InterpreterToolProvider;
  storage: ArtifactStorage | null | undefined;
  /** The artifact on screen. */
  requestRef: RefObject<{ id: string | null; version?: string }>;
  /** False for a card that does not render the dashboard. */
  showsContent: boolean;
  /** The artifact's program is here to show. */
  hasProgram: boolean;
}): {
  toolProvider: InterpreterToolProvider;
  refreshing: boolean;
  /** Do not show the program yet: the saved state is being read. */
  held: boolean;
  /** The state the dashboard was left in, for `Renderer`'s `initialState`. */
  savedState: State | undefined;
  /** For `Renderer`'s `onStateUpdate`. */
  onStateChange: (state: State) => void;
} {
  const [refreshing, setRefreshing] = useState(false);
  useLayoutEffect(() => setRefreshing(false), [refreshing]);
  const runRef = useRef<Run | null>(null);
  const storageRef = useRef(storage);
  storageRef.current = storage;
  // The read made when the content was shown, for its first run to take.
  const openingReadRef = useRef<{ id: string; saved: Promise<Record<string, unknown>> } | null>(
    null,
  );

  const lastResults = useMemo(() => {
    /** A refresh was asked for and the queries have not run again yet. */
    let awaitingRefresh = false;
    /** A changed state, waiting to be saved. */
    let unsavedState: { id: string; value: { version: string; state: State } } | null = null;
    let stateTimer: ReturnType<typeof setTimeout> | undefined;

    const provider: InterpreterToolProvider = {
      callTool(params) {
        const run = currentRun();
        if (!run) return toolProvider.callTool(params);
        const key = queryKey(params.name, params.arguments);
        if (!run.firstBatch) {
          // Saved for the next open, unless the artifact on screen changed meanwhile.
          const real = toolProvider.callTool(params);
          void real.then(
            (result) => run === runRef.current && keep(run, key, result),
            () => {},
          );
          return real;
        }
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

    // The first run takes the read made when the content was shown; a later one reads again.
    const currentRun = (): Run | null => {
      const { id, version } = requestRef.current;
      const store = storageRef.current;
      if (!id || !version || !store?.getQueryResults) return null;
      const run = runRef.current;
      if (run?.id === id && run.version === version) return run;
      dropRun();
      const opening = openingReadRef.current;
      openingReadRef.current = null;
      return (runRef.current = {
        id,
        version,
        saved: opening?.id === id ? opening.saved : store.getQueryResults(id).catch(() => ({})),
        firstBatch: true,
        calls: new Map(),
        joined: false,
      });
    };

    // Saved with the version the call was made with, also during an edit.
    const keep = (run: Run, key: string, { structuredContent: result }: ToolResult) => {
      if (result === undefined || JSON.stringify(result).length > 256 * 1024) return;
      const value = { version: run.version, result };
      storageRef.current?.putQueryResult?.(run.id, { key, value });
    };

    const join = async (run: Run, key: string, real: Promise<ToolResult>): Promise<ToolResult> => {
      const call: FirstCall = { real, settled: false, replay: false };
      run.calls.set(key, call);
      run.joined = true;
      const settle = () => {
        call.settled = true;
        if (run === runRef.current) flushSoon(run);
      };
      // A result that cannot be kept must still settle the call.
      void real
        .then((result) => keep(run, key, result))
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

    // One save for a burst of changes, with the version the state was changed on.
    const stateChanged = (state: State) => {
      const { id, version } = requestRef.current;
      if (!id || !version || !storageRef.current?.putQueryResult) return;
      if (JSON.stringify(state).length > 256 * 1024) return;
      unsavedState = { id, value: { version, state } };
      clearTimeout(stateTimer);
      stateTimer = setTimeout(saveState, SAVE_STATE_AFTER_MS);
    };

    const saveState = () => {
      clearTimeout(stateTimer);
      if (!unsavedState) return;
      const { id, value } = unsavedState;
      unsavedState = null;
      storageRef.current?.putQueryResult?.(id, { key: STATE_KEY, value });
    };

    return { provider, afterRefresh, dropRun, stateChanged, saveState };
  }, [toolProvider, requestRef]);

  // The queries have run again (a child's effects run first).
  useEffect(() => {
    if (!refreshing) lastResults.afterRefresh();
  }, [refreshing, lastResults]);
  // Content shown again later is a new run: it reads the saved results again.
  useEffect(() => lastResults.dropRun, [showsContent, lastResults]);
  // A state change still waiting is saved when the content goes away.
  useEffect(() => lastResults.saveState, [showsContent, lastResults]);

  // ── Saved state ──
  // Read when the content is shown, so a card that shows no content never reads.
  const { id, version } = requestRef.current;
  const reads = showsContent && !!id && !!storage?.getQueryResults;
  const [read, setRead] = useState<{ id: string; entries: Record<string, unknown> | null }>();
  const restoredRef = useRef<{ state: State | undefined } | null>(null);
  useEffect(() => {
    const store = storageRef.current;
    if (!reads || !id || !store?.getQueryResults) return;
    const saved = store.getQueryResults(id).catch(() => ({}));
    openingReadRef.current = { id, saved };
    restoredRef.current = null;
    let active = true;
    // Whichever is first: the entries, or none once the wait is over.
    const settle = (entries: Record<string, unknown> | null) => {
      if (active) setRead((current) => current ?? { id, entries });
    };
    void saved.then(settle);
    const timer = setTimeout(() => settle(null), READ_WAIT_MS);
    return () => {
      active = false;
      clearTimeout(timer);
      setRead(undefined);
    };
  }, [reads, id]);
  const held = reads && read?.id !== id;
  // Decided once, when the program is first shown: `Renderer` applies an `initialState`
  // that changes later too, over what the user chose, and runs the queries again.
  if (reads && !held && hasProgram && !restoredRef.current) {
    const entry = read?.entries?.[STATE_KEY] as { version?: unknown; state?: State } | undefined;
    const forThisVersion = !!version && typeof entry === "object" && entry?.version === version;
    restoredRef.current = { state: forThisVersion ? entry.state : undefined };
  }

  // A storage without saved results gets the original provider, untouched.
  return {
    toolProvider: storage?.getQueryResults ? lastResults.provider : toolProvider,
    refreshing,
    held,
    savedState: reads && !held ? restoredRef.current?.state : undefined,
    onStateChange: lastResults.stateChanged,
  };
}
