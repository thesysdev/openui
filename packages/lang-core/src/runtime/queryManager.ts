// ─────────────────────────────────────────────────────────────────────────────
// Query Manager — reactive data fetching for openui-lang
// ─────────────────────────────────────────────────────────────────────────────

import type { OpenUIError } from "../parser/types";
import { McpToolError } from "./mcp";
import { ToolNotFoundError } from "./toolProvider";

/**
 * ToolProvider interface for Query() and Mutation() tool calls.
 * Framework-agnostic — works with MCP, REST, GraphQL, or any backend.
 *
 * @example
 * ```ts
 * // Function map (Renderer normalizes this automatically)
 * <Renderer toolProvider={{
 *   get_users: (args) => fetch(`/api/users`).then(r => r.json()),
 * }} />
 *
 * // MCP client (Renderer wraps extractToolResult automatically)
 * <Renderer toolProvider={mcpClient} />
 * ```
 */
export interface ToolProvider {
  callTool(toolName: string, args: Record<string, unknown>): Promise<unknown>;
}

// ── Public types ─────────────────────────────────────────────────────────────

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
  __openui_errors: OpenUIError[];
}

export interface QueryManager {
  /** Set enabled to false to register queries without starting tool calls or refresh timers. */
  evaluateQueries(queryNodes: QueryNode[], options?: { enabled?: boolean }): void;
  getResult(statementId: string): unknown;
  isLoading(statementId: string): boolean;
  isAnyLoading(): boolean;
  invalidate(statementIds?: string[]): void;
  registerMutations(nodes: MutationNode[]): void;
  fireMutation(
    statementId: string,
    evaluatedArgs: Record<string, unknown>,
    refreshQueryIds?: string[],
  ): Promise<boolean>;
  getMutationResult(statementId: string): MutationResult | null;
  subscribe(listener: () => void): () => void;
  getSnapshot(): QuerySnapshot;
  activate(): void;
  dispose(): void;
}

// ── Internal types ───────────────────────────────────────────────────────────

interface QueryEntry {
  toolName: string;
  args: unknown;
  defaults: unknown;
  cacheKey: string;
  prevCacheKey?: string;
  everFetched: boolean;
  refreshInterval: number;
  timer?: ReturnType<typeof setInterval>;
  needsRefetch: boolean;
  error?: OpenUIError;
}

interface MutationEntry {
  toolName: string;
  result: MutationResult;
  error?: OpenUIError;
}

interface CacheEntry {
  data: unknown;
  inFlight: boolean;
}

// ── Utilities ────────────────────────────────────────────────────────────────

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
    // Serialize non-JSON-safe primitives to stable strings.
    // evaluate() can pull arbitrary values from store/ref state,
    // including undefined in object literals and edge-case numbers.
    if (val === undefined) return "__undefined__";
    if (typeof val === "number") {
      if (Number.isNaN(val)) return "__NaN__";
      if (val === Infinity) return "__Inf__";
      if (val === -Infinity) return "__-Inf__";
    }
    return val;
  });
}

function buildCacheKey(toolName: string, args: unknown, deps: unknown): string {
  const depsKey = deps != null ? "::" + stableStringify(deps) : "";
  return toolName + "::" + stableStringify(args) + depsKey;
}

// ── Factory ──────────────────────────────────────────────────────────────────

export function createQueryManager(toolProvider: ToolProvider | null): QueryManager {
  const queries = new Map<string, QueryEntry>();
  const mutations = new Map<string, MutationEntry>();
  const cache = new Map<string, CacheEntry>();
  const listeners = new Set<() => void>();

  let snapshot: QuerySnapshot = {
    __openui_loading: [],
    __openui_refetching: [],
    __openui_errors: [],
  };
  let snapshotJson = JSON.stringify(snapshot);
  let disposed = false;
  let generation = 0;
  let enabled = true;

  // ── Snapshot & notification ──────────────────────────────────────────────

  function rebuildSnapshot(): boolean {
    const out: QuerySnapshot = {
      __openui_loading: [],
      __openui_refetching: [],
      __openui_errors: [],
    };

    for (const [sid, q] of queries) {
      const entry = cache.get(q.cacheKey);
      if (entry && entry.data !== undefined) {
        // Use settled data (even while refetching — shows last good value)
        out[sid] = entry.data;
      } else if (q.prevCacheKey) {
        const prev = cache.get(q.prevCacheKey);
        if (prev && prev.data !== undefined) {
          out[sid] = prev.data;
        } else {
          out[sid] = q.defaults;
        }
      } else {
        out[sid] = q.defaults;
      }
      // Shared queries must report the same loading state as their cached request.
      if (entry?.inFlight) {
        out.__openui_loading.push(sid);
        if (q.everFetched) out.__openui_refetching.push(sid);
      }
      if (q.error) out.__openui_errors.push(q.error);
    }

    for (const [sid, m] of mutations) {
      out[sid] = m.result;
      if (m.error) out.__openui_errors.push(m.error);
    }

    try {
      const outJson = JSON.stringify(out);
      if (outJson === snapshotJson) return false;
      snapshot = out;
      snapshotJson = outJson;
    } catch {
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

  // ── Fetch execution ──────────────────────────────────────────────────────

  async function executeFetch(cacheKey: string, statementId: string) {
    if (!toolProvider || !enabled) return;

    const q = queries.get(statementId);
    if (!q) return;

    // Keep the request tied to its original inputs even if a query changes while it runs.
    const fetchKey = cacheKey;
    const toolName = q.toolName;
    const args = q.args;
    const fetchGeneration = generation;

    // Mark in-flight — use undefined as "no data yet" sentinel (distinct from null)
    let entry = cache.get(fetchKey);
    if (!entry) {
      entry = { data: undefined, inFlight: true };
      cache.set(fetchKey, entry);
    } else {
      entry.inFlight = true;
    }
    rebuildSnapshot();
    notify();

    try {
      const data = await toolProvider.callTool(toolName, (args as Record<string, unknown>) ?? {});
      // Ignore completions from a disposed lifecycle or a replaced cache entry.
      if (disposed || fetchGeneration !== generation || cache.get(fetchKey) !== entry) return;
      entry.data = data ?? null;
      // Several queries can share a request. Update only its current consumers.
      for (const current of queries.values()) {
        if (current.cacheKey !== fetchKey) continue;
        current.everFetched = true;
        current.error = undefined;

        // Clear the old reference before checking whether its cache can be removed.
        if (current.prevCacheKey && current.prevCacheKey !== fetchKey) {
          const prevKey = current.prevCacheKey;
          current.prevCacheKey = undefined;
          cleanupCacheEntry(prevKey);
        }
      }
    } catch (err) {
      if (disposed || fetchGeneration !== generation || cache.get(fetchKey) !== entry) return;
      // Report shared request failures against each current consumer's statement ID.
      for (const [currentId, current] of queries) {
        if (current.cacheKey !== fetchKey) continue;
        if (err instanceof ToolNotFoundError) {
          current.error = {
            source: "query",
            code: "tool-not-found",
            message: `Query tool "${toolName}" not found`,
            statementId: currentId,
            component: "Query",
            toolName,
            hint: err.availableTools.length
              ? `Available tools: ${err.availableTools.join(", ")}`
              : undefined,
          };
        } else if (err instanceof McpToolError) {
          current.error = {
            source: "query",
            code: "mcp-error",
            message: `Query "${toolName}" returned an error: ${err.toolErrorText}`,
            statementId: currentId,
            component: "Query",
            toolName,
          };
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          current.error = {
            source: "query",
            code: "tool-error",
            message: `Query "${toolName}" failed: ${msg}`,
            statementId: currentId,
            component: "Query",
            toolName,
          };
        }
      }
      console.error(`Query "${toolName}" failed:`, err);
    } finally {
      // An obsolete request must not clear a newer request's loading state.
      if (!disposed && fetchGeneration === generation && cache.get(fetchKey) === entry) {
        entry.inFlight = false;
        // Collapse queued invalidations for this shared request into one refetch.
        let refetchId: string | undefined;
        for (const [currentId, current] of queries) {
          if (current.cacheKey === fetchKey && current.needsRefetch) {
            current.needsRefetch = false;
            refetchId ??= currentId;
          }
        }
        if (rebuildSnapshot()) notify();
        // Re-fetch only if the invalidated selection is still current.
        if (refetchId) executeFetch(fetchKey, refetchId);
      }
    }
  }

  /** Remove a cache entry if no query references it. */
  function cleanupCacheEntry(cacheKey: string) {
    for (const q of queries.values()) {
      if (q.cacheKey === cacheKey || q.prevCacheKey === cacheKey) return;
    }
    cache.delete(cacheKey);
  }

  // ── Query evaluation ─────────────────────────────────────────────────────

  function evaluateQueries(queryNodes: QueryNode[], options?: { enabled?: boolean }) {
    if (disposed) return;
    // Omitted options preserve automatic execution; pausing retains registered queries and data.
    enabled = options?.enabled !== false;

    const activeIds = new Set(queryNodes.map((n) => n.statementId));

    // Clean up removed queries
    for (const [sid, q] of queries) {
      if (!activeIds.has(sid)) {
        if (q.timer) clearInterval(q.timer);
        queries.delete(sid);
        // Clean up cache entries that are no longer referenced
        cleanupCacheEntry(q.cacheKey);
        if (q.prevCacheKey) cleanupCacheEntry(q.prevCacheKey);
      }
    }

    // Process active queries
    for (const node of queryNodes) {
      if (!node.complete) continue;

      const cacheKey = buildCacheKey(node.toolName, node.args, node.deps);
      const existing = queries.get(node.statementId);

      if (existing) {
        // Track previous cache key for fallback display
        if (existing.cacheKey !== cacheKey) {
          existing.prevCacheKey = existing.cacheKey;
          // Errors and queued refetches from the old inputs must not carry into the new selection.
          existing.error = undefined;
          existing.needsRefetch = false;
        }
        existing.toolName = node.toolName;
        existing.args = node.args;
        existing.defaults = node.defaults;
        existing.cacheKey = cacheKey;
      } else {
        queries.set(node.statementId, {
          toolName: node.toolName,
          args: node.args,
          defaults: node.defaults,
          cacheKey,
          everFetched: false,
          refreshInterval: 0,
          needsRefetch: false,
        });
      }

      const q = queries.get(node.statementId)!;

      // Fire fetch if no settled data and not already in-flight
      const entry = cache.get(cacheKey);
      const hasSettledData = entry && entry.data !== undefined && !entry.inFlight;
      if (enabled && toolProvider && !hasSettledData && !entry?.inFlight) {
        executeFetch(cacheKey, node.statementId);
      }

      // Stop refresh timers while execution is paused, then restore them when enabled.
      const newInterval = enabled ? (node.refreshInterval ?? 0) : 0;
      if (newInterval !== q.refreshInterval) {
        if (q.timer) {
          clearInterval(q.timer);
          q.timer = undefined;
        }
        if (newInterval > 0) {
          q.timer = setInterval(() => {
            if (disposed || !toolProvider) return;
            const entry = cache.get(q.cacheKey);
            if (!entry?.inFlight) {
              executeFetch(q.cacheKey, node.statementId);
            }
          }, newInterval * 1000);
        }
        q.refreshInterval = newInterval;
      }
    }

    if (rebuildSnapshot()) notify();
  }

  // ── Query accessors ──────────────────────────────────────────────────────

  function getResult(statementId: string): unknown {
    const q = queries.get(statementId);
    if (!q) return null;
    const entry = cache.get(q.cacheKey);
    if (entry && entry.data !== undefined) return entry.data;
    // Fall back to previous cache entry while loading
    if (q.prevCacheKey) {
      const prev = cache.get(q.prevCacheKey);
      if (prev && prev.data !== undefined) return prev.data;
    }
    return q.defaults;
  }

  function isLoading(statementId: string): boolean {
    const q = queries.get(statementId);
    return q ? (cache.get(q.cacheKey)?.inFlight ?? false) : false;
  }

  function isAnyLoading(): boolean {
    for (const q of queries.values()) {
      if (cache.get(q.cacheKey)?.inFlight) return true;
    }
    return false;
  }

  function invalidate(statementIds?: string[]) {
    // Ignore refresh requests while paused rather than scheduling work for incomplete generation.
    if (disposed || !toolProvider || !enabled) return;

    const targets = statementIds?.length
      ? statementIds.filter((sid) => queries.has(sid))
      : [...queries.keys()];

    // Queries sharing a cache key need only one refresh, including when a fetch is already running.
    const invalidatedKeys = new Set<string>();
    for (const sid of targets) {
      const q = queries.get(sid);
      if (!q || invalidatedKeys.has(q.cacheKey)) continue;
      invalidatedKeys.add(q.cacheKey);
      const entry = cache.get(q.cacheKey);
      if (entry?.inFlight) {
        q.needsRefetch = true;
      } else {
        executeFetch(q.cacheKey, sid);
      }
    }
  }

  // ── Mutation methods ─────────────────────────────────────────────────────

  function registerMutations(nodes: MutationNode[]) {
    const activeIds = new Set(nodes.map((n) => n.statementId));

    // Clean up removed mutations
    for (const sid of mutations.keys()) {
      if (!activeIds.has(sid)) mutations.delete(sid);
    }

    // Register/update active mutations
    for (const node of nodes) {
      const existing = mutations.get(node.statementId);
      if (existing) {
        if (existing.toolName !== node.toolName) {
          existing.toolName = node.toolName;
          existing.result = { status: "idle", data: null, error: null };
          existing.error = undefined;
        }
      } else {
        mutations.set(node.statementId, {
          toolName: node.toolName,
          result: { status: "idle" },
        });
      }
    }

    if (rebuildSnapshot()) notify();
  }

  async function fireMutation(
    statementId: string,
    evaluatedArgs: Record<string, unknown>,
    refreshQueryIds?: string[],
  ): Promise<boolean> {
    // Pause user-triggered mutations along with automatic query execution.
    if (disposed || !toolProvider || !enabled) return false;
    const m = mutations.get(statementId);
    if (!m) return false;

    // Reject concurrent calls on the same mutation — prevents double-submit
    if (m.result.status === "loading") return false;

    const gen = generation;

    m.result = { status: "loading" };
    rebuildSnapshot();
    notify();

    let success = false;
    try {
      const data = await toolProvider.callTool(m.toolName, evaluatedArgs);
      if (disposed || gen !== generation) return false;
      m.result = { status: "success", data };
      m.error = undefined;
      success = true;
    } catch (err) {
      if (disposed || gen !== generation) return false;
      const msg = err instanceof Error ? err.message : String(err);
      m.result = { status: "error", error: msg };
      if (err instanceof ToolNotFoundError) {
        m.error = {
          source: "mutation",
          code: "tool-not-found",
          message: `Mutation tool "${m.toolName}" not found`,
          statementId,
          component: "Mutation",
          toolName: m.toolName,
          hint: err.availableTools.length
            ? `Available tools: ${err.availableTools.join(", ")}`
            : undefined,
        };
      } else if (err instanceof McpToolError) {
        m.error = {
          source: "mutation",
          code: "mcp-error",
          message: `Mutation "${m.toolName}" returned an error: ${err.toolErrorText}`,
          statementId,
          component: "Mutation",
          toolName: m.toolName,
        };
      } else {
        m.error = {
          source: "mutation",
          code: "tool-error",
          message: `Mutation "${m.toolName}" failed: ${msg}`,
          statementId,
          component: "Mutation",
          toolName: m.toolName,
        };
      }
    }

    rebuildSnapshot();
    notify();

    if (success && refreshQueryIds?.length) {
      invalidate(refreshQueryIds);
    }

    return success;
  }

  function getMutationResult(statementId: string): MutationResult | null {
    return mutations.get(statementId)?.result ?? null;
  }

  // ── Pub/sub ──────────────────────────────────────────────────────────────

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getSnapshot(): QuerySnapshot {
    return snapshot;
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  function activate() {
    disposed = false;
  }

  function dispose() {
    disposed = true;
    generation++;
    listeners.clear();
    // Clear timers and transient state, preserve cache + query entries for Strict Mode re-attach
    for (const q of queries.values()) {
      if (q.timer) {
        clearInterval(q.timer);
        q.timer = undefined;
      }
      q.refreshInterval = 0;
      q.needsRefetch = false;
    }
    mutations.clear();
    // Reactivation can fetch again without waiting for requests from the disposed lifecycle.
    for (const entry of cache.values()) entry.inFlight = false;
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
