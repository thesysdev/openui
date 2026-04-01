// ─────────────────────────────────────────────────────────────────────────────
// Query Manager — reactive data fetching for openui-lang
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Transport interface for Query() and Mutation() tool calls.
 * Framework-agnostic — works with MCP, REST, GraphQL, or any backend.
 *
 * @example
 * ```ts
 * // MCP
 * const transport: Transport = createMcpTransport({ url: "https://api.com/mcp/sse" });
 *
 * // REST
 * const transport: Transport = {
 *   callTool: (name, args) => fetch(`/api/${name}`, { method: "POST", body: JSON.stringify(args) }).then(r => r.json()),
 * };
 *
 * // Mock
 * const transport: Transport = {
 *   callTool: async (name, args) => ({ items: [{ id: 1, name: "Test" }] }),
 * };
 * ```
 */
export interface Transport {
  callTool(toolName: string, args: Record<string, unknown>): Promise<unknown>;
}

export interface QueryNode {
  statementId: string;
  toolName: string;
  args: unknown;
  defaults: unknown;
  /** Evaluated dependency value — included in cache key to force re-fetch on change. */
  deps: unknown;
  /** Auto-refresh interval in seconds. */
  refreshInterval?: number;
  complete: boolean;
}

export interface MutationNode {
  statementId: string;
  toolName: string;
}

export interface MutationResult {
  status: "idle" | "loading" | "success" | "error";
  data?: unknown;
  error?: unknown;
}

export interface QuerySnapshot extends Record<string, unknown> {
  __openui_loading: string[];
  __openui_refetching: string[];
}

export interface QueryManager {
  evaluateQueries(queryNodes: QueryNode[]): void;
  getResult(statementId: string): unknown;
  /** Returns true if the given statement is currently fetching. */
  isLoading(statementId: string): boolean;
  /** Returns true if ANY query is currently fetching. */
  isAnyLoading(): boolean;
  /** Re-fetch specific queries by statementId, or all if no ids provided. */
  invalidate(statementIds?: string[]): void;
  /** Register mutation declarations from the parser. */
  registerMutations(nodes: MutationNode[]): void;
  /** Fire a mutation with evaluated args. Called on button click. Returns true on success, false on error. */
  fireMutation(
    statementId: string,
    evaluatedArgs: Record<string, unknown>,
    refreshQueryIds?: string[],
  ): Promise<boolean>;
  /** Get the current result of a mutation (idle/loading/success/error). */
  getMutationResult(statementId: string): MutationResult | null;
  subscribe(listener: () => void): () => void;
  getSnapshot(): QuerySnapshot;
  /** Re-activate after dispose (needed for React Strict Mode double-mount). */
  activate(): void;
  dispose(): void;
}

/** JSON.stringify with stable key ordering at all nesting levels. */
function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key: string, val: unknown) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(val as object).sort()) {
        sorted[k] = (val as any)[k];
      }
      return sorted;
    }
    // Serialize non-JSON-safe primitives to stable strings
    if (val === undefined) return "__undefined__";
    if (typeof val === "number") {
      if (Number.isNaN(val)) return "__NaN__";
      if (val === Infinity) return "__Inf__";
      if (val === -Infinity) return "__-Inf__";
    }
    return val;
  });
}

// ── Factory ──────────────────────────────────────────────────────────────────

export function createQueryManager(transport: Transport | null): QueryManager {
  const results = new Map<string, unknown>();
  const defaults = new Map<string, unknown>();
  const pending = new Set<string>();
  /** Maps statementId → current cache key */
  const lastKeys = new Map<string, string>();
  /** Maps statementId → previous cache key (for fallback while loading) */
  const prevKeys = new Map<string, string>();
  /** Maps statementId → {toolName, args} for reliable invalidation (avoids parsing cache keys) */
  const queryMeta = new Map<string, { toolName: string; args: unknown }>();
  /** Tracks which statementIds are currently loading */
  const loadingStmts = new Set<string>();
  /** Tracks which stmtIds have completed at least one successful fetch */
  const hasEverFetched = new Set<string>();
  const listeners = new Set<() => void>();
  const timers = new Map<string, ReturnType<typeof setInterval>>();
  const lastIntervals = new Map<string, number>();
  // ── Mutation state ───
  const mutationMeta = new Map<string, { toolName: string }>();
  const mutationResults = new Map<string, MutationResult>();
  let snapshot: QuerySnapshot = { __openui_loading: [], __openui_refetching: [] };
  let snapshotJson = JSON.stringify(snapshot);
  let disposed = false;
  let generation = 0;
  const needsRefetch = new Map<string, boolean>();
  const removedQueryIds = new Set<string>();

  /**
   * Rebuild the snapshot from current state. Returns true if snapshot content
   * changed. Preserves snapshot identity when content is unchanged to avoid
   * infinite re-render loops with useSyncExternalStore.
   */
  function rebuildSnapshot(): boolean {
    const out: QuerySnapshot = { __openui_loading: [], __openui_refetching: [] };
    for (const [sid, cacheKey] of lastKeys) {
      if (results.has(cacheKey)) {
        out[sid] = results.get(cacheKey);
      } else {
        // Fall back to previous result while new fetch is in-flight
        const prev = prevKeys.get(sid);
        if (prev && results.has(prev)) {
          out[sid] = results.get(prev);
        } else {
          out[sid] = defaults.get(sid) ?? null;
        }
      }
    }
    // Include mutation results in snapshot (keyed by statementId)
    for (const [sid, mr] of mutationResults) {
      out[sid] = mr;
    }
    // Include loading state in snapshot so React detects changes
    out.__openui_loading = [...loadingStmts];
    out.__openui_refetching = [...loadingStmts].filter((id) => hasEverFetched.has(id));

    // Compare against cached JSON string (avoids double-stringify)
    try {
      const outJson = JSON.stringify(out);
      if (outJson === snapshotJson) return false;
      snapshot = out;
      snapshotJson = outJson;
    } catch {
      // Circular refs or other serialization issues — force a new snapshot identity
      snapshot = out;
      snapshotJson = "";
    }
    return true;
  }

  function notify() {
    for (const listener of [...listeners]) {
      listener();
    }
  }

  async function executeFetch(
    cacheKey: string,
    statementId: string,
    toolName: string,
    args: unknown,
  ) {
    // Check transport before setting loading state to prevent loading flash
    if (!transport) return;

    pending.add(cacheKey);
    loadingStmts.add(statementId);
    rebuildSnapshot();
    notify();
    try {
      const data = await transport.callTool(toolName, (args as Record<string, unknown>) ?? {});
      if (disposed) return;
      // Skip result write if this query was removed while fetch was in-flight
      if (removedQueryIds.has(statementId)) {
        removedQueryIds.delete(statementId);
        return;
      }
      // Normalize undefined results to null
      results.set(cacheKey, data ?? null);
      hasEverFetched.add(statementId);
      // Clean up old cached result now that new one has arrived
      const prev = prevKeys.get(statementId);
      if (prev && prev !== cacheKey) {
        results.delete(prev);
      }
      prevKeys.delete(statementId);
    } catch (err) {
      console.error(`Query "${toolName}" failed:`, err);
    } finally {
      pending.delete(cacheKey);
      loadingStmts.delete(statementId);
      if (rebuildSnapshot()) notify();
      // If invalidation occurred while this fetch was in-flight, re-fetch
      if (needsRefetch.get(statementId)) {
        needsRefetch.delete(statementId);
        const meta = queryMeta.get(statementId);
        const key = lastKeys.get(statementId);
        if (meta && key) {
          executeFetch(key, statementId, meta.toolName, meta.args);
        }
      }
    }
  }

  function evaluateQueries(queryNodes: QueryNode[]) {
    if (disposed) return;

    removedQueryIds.clear();

    // Clean up timers and state for queries that no longer exist
    const activeIds = new Set(queryNodes.map((n) => n.statementId));
    for (const [sid, timer] of timers) {
      if (!activeIds.has(sid)) {
        clearInterval(timer);
        timers.delete(sid);
      }
    }
    // Remove all state for deleted queries.
    // Collect active cache keys first so we don't delete shared entries.
    const activeCacheKeys = new Set<string>();
    for (const [sid, key] of lastKeys) {
      if (activeIds.has(sid)) activeCacheKeys.add(key);
    }
    for (const [sid, key] of prevKeys) {
      if (activeIds.has(sid)) activeCacheKeys.add(key);
    }
    for (const sid of [...lastKeys.keys()]) {
      if (!activeIds.has(sid)) {
        removedQueryIds.add(sid);
        const key = lastKeys.get(sid);
        if (key && !activeCacheKeys.has(key)) results.delete(key);
        const prevKey = prevKeys.get(sid);
        if (prevKey && !activeCacheKeys.has(prevKey)) results.delete(prevKey);
        lastKeys.delete(sid);
        prevKeys.delete(sid);
        queryMeta.delete(sid);
        defaults.delete(sid);
        loadingStmts.delete(sid);
        hasEverFetched.delete(sid);
        lastIntervals.delete(sid);
      }
    }

    for (const node of queryNodes) {
      if (!node.complete) continue;

      const depsKey = node.deps != null ? "::" + stableStringify(node.deps) : "";
      const cacheKey = node.toolName + "::" + stableStringify(node.args) + depsKey;

      defaults.set(node.statementId, node.defaults);
      queryMeta.set(node.statementId, { toolName: node.toolName, args: node.args });

      // Track previous key for fallback (keep old data visible while loading)
      const prevKey = lastKeys.get(node.statementId);
      if (prevKey && prevKey !== cacheKey) {
        prevKeys.set(node.statementId, prevKey);
        // DON'T delete old result — keep it for fallback display
      }
      lastKeys.set(node.statementId, cacheKey);

      // Fire fetch if not cached, not pending, and transport is available
      if (transport && !results.has(cacheKey) && !pending.has(cacheKey)) {
        executeFetch(cacheKey, node.statementId, node.toolName, node.args);
      }

      // Setup / reconfigure auto-refresh timer
      const currentInterval = node.refreshInterval ?? 0;
      const previousInterval = lastIntervals.get(node.statementId) ?? 0;

      if (currentInterval !== previousInterval) {
        // Clear old timer if it exists
        const existingTimer = timers.get(node.statementId);
        if (existingTimer) {
          clearInterval(existingTimer);
          timers.delete(node.statementId);
        }

        // Create new timer if interval is positive
        if (currentInterval > 0) {
          timers.set(
            node.statementId,
            setInterval(() => {
              if (disposed || !transport) return;
              const k = lastKeys.get(node.statementId);
              if (k && !pending.has(k)) {
                const meta = queryMeta.get(node.statementId);
                if (meta) {
                  executeFetch(k, node.statementId, meta.toolName, meta.args);
                }
              }
            }, currentInterval * 1000),
          );
        }

        lastIntervals.set(node.statementId, currentInterval);
      }
    }

    if (rebuildSnapshot()) notify();
  }

  function getResult(statementId: string): unknown {
    const key = lastKeys.get(statementId);
    if (key && results.has(key)) return results.get(key);
    // Fall back to previous result while loading
    const prev = prevKeys.get(statementId);
    if (prev && results.has(prev)) return results.get(prev);
    return defaults.get(statementId) ?? null;
  }

  function isLoading(statementId: string): boolean {
    return loadingStmts.has(statementId);
  }

  function isAnyLoading(): boolean {
    return loadingStmts.size > 0;
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function getSnapshot(): QuerySnapshot {
    return snapshot;
  }

  function invalidate(statementIds?: string[]) {
    if (disposed || !transport) return;
    // Re-fetch targeted queries (or all if no ids provided).
    // Keep old data visible until new fetches complete.
    const targets = statementIds?.length
      ? statementIds.filter((sid) => lastKeys.has(sid))
      : [...lastKeys.keys()];

    for (const sid of targets) {
      const cacheKey = lastKeys.get(sid);
      const meta = queryMeta.get(sid);
      if (!cacheKey || !meta) continue;
      if (pending.has(cacheKey)) {
        // Fetch is already in-flight — flag for re-fetch when it completes
        needsRefetch.set(sid, true);
      } else {
        executeFetch(cacheKey, sid, meta.toolName, meta.args);
      }
    }
  }

  // ── Mutation methods ─────────────────────────────────────────────────────

  function registerMutations(nodes: MutationNode[]) {
    // Clean up removed mutations
    const activeIds = new Set(nodes.map((n) => n.statementId));
    for (const sid of [...mutationMeta.keys()]) {
      if (!activeIds.has(sid)) {
        mutationMeta.delete(sid);
        mutationResults.delete(sid);
      }
    }
    // Register active mutations
    for (const node of nodes) {
      const prev = mutationMeta.get(node.statementId);
      // Reset result when the backing tool changes (declaration was edited)
      if (prev && prev.toolName !== node.toolName) {
        mutationResults.set(node.statementId, { status: "idle", data: null, error: null });
      }
      mutationMeta.set(node.statementId, { toolName: node.toolName });
      if (!mutationResults.has(node.statementId)) {
        mutationResults.set(node.statementId, { status: "idle" });
      }
    }
    if (rebuildSnapshot()) notify();
  }

  async function fireMutation(
    statementId: string,
    evaluatedArgs: Record<string, unknown>,
    refreshQueryIds?: string[],
  ): Promise<boolean> {
    if (disposed || !transport) return false;
    const meta = mutationMeta.get(statementId);
    if (!meta) return false;

    // Capture generation to detect stale writes after dispose/re-activate
    const gen = generation;

    // Set loading state
    mutationResults.set(statementId, { status: "loading" });
    rebuildSnapshot();
    notify();

    let success = false;
    try {
      const data = await transport.callTool(meta.toolName, evaluatedArgs);
      if (disposed || gen !== generation) return false;
      mutationResults.set(statementId, { status: "success", data });
      success = true;
    } catch (err: any) {
      if (disposed || gen !== generation) return false;
      mutationResults.set(statementId, {
        status: "error",
        error: err?.message ?? String(err),
      });
    }

    rebuildSnapshot();
    notify();

    // Auto-refresh queries after mutation completes
    if (success && refreshQueryIds?.length) {
      invalidate(refreshQueryIds);
    }

    return success;
  }

  function getMutationResult(statementId: string): MutationResult | null {
    return mutationResults.get(statementId) ?? null;
  }

  function activate() {
    disposed = false;
  }

  function dispose() {
    disposed = true;
    generation++;
    loadingStmts.clear();
    listeners.clear();
    timers.forEach((t) => clearInterval(t));
    timers.clear();
    // Preserve lastIntervals across dispose/activate so timers can be
    // correctly reconfigured on re-mount (React Strict Mode).
    mutationResults.clear();
    mutationMeta.clear();
    // Keep results, defaults, lastKeys, prevKeys, queryMeta for Strict Mode re-attach
  }

  return {
    evaluateQueries,
    getResult,
    isLoading,
    isAnyLoading,
    invalidate,
    registerMutations,
    fireMutation,
    getMutationResult,
    subscribe,
    getSnapshot,
    activate,
    dispose,
  };
}
