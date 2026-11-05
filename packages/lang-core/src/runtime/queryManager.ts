// ─────────────────────────────────────────────────────────────────────────────
// Query Manager — reactive data fetching for openui-lang
// ─────────────────────────────────────────────────────────────────────────────

import type { OpenUIError, QueryStatementInfo } from "../parser/types";
import { evaluate, type EvaluationContext } from "./evaluator";
import { McpToolError } from "./mcp";
import { ToolNotFoundError } from "./toolProvider";

/** Runs Query() and Mutation() tools: an MCP client, a function map, or any backend. */
export interface ToolProvider {
  callTool(toolName: string, args: Record<string, unknown>): Promise<unknown>;
}

// ── Public types ─────────────────────────────────────────────────────────────

export interface QueryNode {
  statementId: string;
  toolName: string;
  args: unknown;
  defaults: unknown;
  /** Part of the cache key: a change refetches. */
  deps: unknown;
  /** Auto-refresh interval in seconds. */
  refreshInterval?: number;
  complete: boolean;
  /** Queries this one reads; it waits until each has a result. */
  waitFor?: string[];
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
  /**
   * Run `ParseResult.queryStatements`. A query that reads another's result waits for it and runs
   * again when it changes. `context` is read on every evaluation, so it must return live values.
   * `extraDeps` adds values to a query's cache key.
   */
  evaluateStatements(
    statements: QueryStatementInfo[],
    context: EvaluationContext,
    options?: { extraDeps?: (toolName: string) => Record<string, unknown> | undefined },
  ): void;
  /** Run already evaluated queries. They do not wait for each other; see `evaluateStatements`. */
  evaluateQueries(queryNodes: QueryNode[]): void;
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
  loading: boolean;
  everFetched: boolean;
  refreshInterval: number;
  timer?: ReturnType<typeof setInterval>;
  needsRefetch: boolean;
  /** A query in waitFor has no result yet. */
  waiting?: boolean;
  waitFor?: string[];
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
  /** The last fetch failed; refetched only on invalidate or refresh. */
  failed?: boolean;
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
    // Values JSON drops or merges
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

/** Evaluate a query statement with the current state and results. */
function toQueryNode(
  statement: QueryStatementInfo,
  context: EvaluationContext,
  extraDeps?: (toolName: string) => Record<string, unknown> | undefined,
): QueryNode {
  const toolName = statement.toolAST ? (evaluate(statement.toolAST, context) as string) : "";
  const deps: Record<string, unknown> = {};
  for (const ref of statement.deps ?? []) deps[ref] = context.getState(ref);
  Object.assign(deps, extraDeps?.(toolName));
  return {
    statementId: statement.statementId,
    toolName,
    args: statement.argsAST ? evaluate(statement.argsAST, context) : null,
    defaults: statement.defaultsAST ? evaluate(statement.defaultsAST, context) : null,
    refreshInterval: statement.refreshAST
      ? (evaluate(statement.refreshAST, context) as number)
      : undefined,
    deps: Object.keys(deps).length > 0 ? deps : undefined,
    complete: statement.complete,
    waitFor: statement.waitFor,
  };
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

  // From evaluateStatements, to re-evaluate readers when a result changes.
  let statements: QueryStatementInfo[] = [];
  let toNode: ((statement: QueryStatementInfo) => QueryNode) | null = null;
  const nodes = new Map<string, QueryNode>();
  /** Per reader: the results it read when its node was built. */
  const seen = new Map<string, Map<string, unknown>>();

  // ── Snapshot & notification ──────────────────────────────────────────────

  function rebuildSnapshot(): boolean {
    const out: QuerySnapshot = {
      __openui_loading: [],
      __openui_refetching: [],
      __openui_errors: [],
    };

    for (const [sid, q] of queries) {
      out[sid] = getResult(sid);
      if (isPending(sid)) {
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
    if (!toolProvider) return;

    const q = queries.get(statementId);
    if (!q) return;

    // If the query's key changes while in flight, this fetch is stale.
    const fetchKey = cacheKey;
    const toolName = q.toolName;
    const args = q.args;

    // undefined = no data yet (null is a result)
    let entry = cache.get(fetchKey);
    if (!entry) {
      entry = { data: undefined, inFlight: true };
      cache.set(fetchKey, entry);
    } else {
      entry.inFlight = true;
    }
    q.loading = true;
    rebuildSnapshot();
    notify();

    try {
      const data = await toolProvider.callTool(toolName, (args as Record<string, unknown>) ?? {});
      if (disposed) return;
      // Stale: the query was removed or its key changed
      const current = queries.get(statementId);
      if (!current || current.cacheKey !== fetchKey) {
        entry.inFlight = false;
        return;
      }

      entry.data = data ?? null;
      entry.failed = false;
      current.everFetched = true;
      for (const q of queries.values()) if (q.cacheKey === fetchKey) q.error = undefined;

      // Clear prevCacheKey first so cleanup does not see it as in use
      if (current.prevCacheKey && current.prevCacheKey !== fetchKey) {
        const prevKey = current.prevCacheKey;
        current.prevCacheKey = undefined;
        cleanupCacheEntry(prevKey);
      }
    } catch (err) {
      const failure =
        err instanceof ToolNotFoundError
          ? {
              code: "tool-not-found" as const,
              message: `Query tool "${toolName}" not found`,
              hint: err.availableTools.length
                ? `Available tools: ${err.availableTools.join(", ")}`
                : undefined,
            }
          : err instanceof McpToolError
            ? {
                code: "mcp-error" as const,
                message: `Query "${toolName}" returned an error: ${err.toolErrorText}`,
              }
            : {
                code: "tool-error" as const,
                message: `Query "${toolName}" failed: ${err instanceof Error ? err.message : String(err)}`,
              };
      // Every query on this key shares the failure
      for (const [sid, q] of queries) {
        if (q.cacheKey !== fetchKey) continue;
        q.error = { source: "query", statementId: sid, component: "Query", toolName, ...failure };
        entry.failed = true;
      }
      console.error(`Query "${toolName}" failed:`, err);
    } finally {
      entry.inFlight = false;
      const current = queries.get(statementId);
      if (current && current.cacheKey === fetchKey) {
        current.loading = false;
        if (rebuildSnapshot()) notify();
        if (current.needsRefetch) {
          current.needsRefetch = false;
          executeFetch(current.cacheKey, statementId);
        }
      } else {
        if (rebuildSnapshot()) notify();
      }
      reevaluateReaders();
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

  function buildNode(statement: QueryStatementInfo): QueryNode {
    const reads = new Map<string, unknown>();
    for (const id of statement.waitFor ?? []) reads.set(id, getData(id));
    const node = toNode!(statement);
    seen.set(statement.statementId, reads);
    nodes.set(statement.statementId, node);
    return node;
  }

  function evaluateStatements(
    next: QueryStatementInfo[],
    context: EvaluationContext,
    options?: { extraDeps?: (toolName: string) => Record<string, unknown> | undefined },
  ) {
    if (disposed) return;
    statements = next;
    toNode = (statement) => toQueryNode(statement, context, options?.extraDeps);
    nodes.clear();
    seen.clear();
    applyNodes(next.map(buildNode));
    reevaluateReaders();
  }

  /**
   * Re-evaluate the readers whose waited-on result changed. Never for a query's own result, so it
   * cannot loop; each round follows one link, and the bound stops cycles.
   */
  function reevaluateReaders() {
    for (let round = 0; round <= statements.length; round++) {
      if (disposed || !toNode) return;
      const stale = new Set(
        statements.filter((s) =>
          s.waitFor?.some((id) => getData(id) !== seen.get(s.statementId)?.get(id)),
        ),
      );
      if (stale.size === 0) return;
      applyNodes(statements.map((s) => (stale.has(s) ? buildNode(s) : nodes.get(s.statementId)!)));
    }
  }

  function evaluateQueries(queryNodes: QueryNode[]) {
    statements = [];
    toNode = null;
    nodes.clear();
    seen.clear();
    applyNodes(queryNodes);
  }

  function applyNodes(queryNodes: QueryNode[]) {
    if (disposed) return;

    const activeIds = new Set(queryNodes.map((n) => n.statementId));

    for (const [sid, q] of queries) {
      if (!activeIds.has(sid)) {
        if (q.timer) clearInterval(q.timer);
        queries.delete(sid);
        cleanupCacheEntry(q.cacheKey);
        if (q.prevCacheKey) cleanupCacheEntry(q.prevCacheKey);
      }
    }

    for (const node of queryNodes) {
      if (!node.complete) continue;

      const cacheKey = buildCacheKey(node.toolName, node.args, node.deps);
      const existing = queries.get(node.statementId);

      if (existing) {
        // Shown while the new key loads
        if (existing.cacheKey !== cacheKey) {
          existing.prevCacheKey = existing.cacheKey;
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
          loading: false,
          everFetched: false,
          refreshInterval: 0,
          needsRefetch: false,
        });
      }

      const q = queries.get(node.statementId)!;

      q.waitFor = node.waitFor;
      q.waiting = node.waitFor?.some((dep) => getData(dep) === undefined) ?? false;
      if (q.waiting) continue;

      const entry = cache.get(cacheKey);
      const settled = entry && (entry.data !== undefined || entry.failed);
      if (toolProvider && !settled && !entry?.inFlight) {
        executeFetch(cacheKey, node.statementId);
      }

      const newInterval = node.refreshInterval ?? 0;
      if (newInterval !== q.refreshInterval) {
        if (q.timer) {
          clearInterval(q.timer);
          q.timer = undefined;
        }
        if (newInterval > 0) {
          q.timer = setInterval(() => {
            if (disposed || !toolProvider || q.waiting) return;
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

  /** Fetched result, or the previous one while refetching; undefined before the first. */
  function getData(statementId: string): unknown {
    const q = queries.get(statementId);
    if (!q) return undefined;
    const data = cache.get(q.cacheKey)?.data;
    return data !== undefined || !q.prevCacheKey ? data : cache.get(q.prevCacheKey)?.data;
  }

  /** Loading, or waiting on a pending query. */
  function isPending(statementId: string, seen = new Set<string>()): boolean {
    const q = queries.get(statementId);
    if (!q || seen.has(statementId)) return false;
    seen.add(statementId);
    return q.loading || (!!q.waiting && (q.waitFor ?? []).some((dep) => isPending(dep, seen)));
  }

  function getResult(statementId: string): unknown {
    const q = queries.get(statementId);
    if (!q) return null;
    const data = getData(statementId);
    return data !== undefined ? data : q.defaults;
  }

  function isLoading(statementId: string): boolean {
    return isPending(statementId);
  }

  function isAnyLoading(): boolean {
    for (const q of queries.values()) {
      if (q.loading) return true;
    }
    return false;
  }

  function invalidate(statementIds?: string[]) {
    if (disposed || !toolProvider) return;

    const targets = statementIds?.length
      ? statementIds.filter((sid) => queries.has(sid))
      : [...queries.keys()];

    for (const sid of targets) {
      const q = queries.get(sid);
      // A waiting query runs when its inputs arrive
      if (!q || q.waiting) continue;
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

    for (const sid of mutations.keys()) {
      if (!activeIds.has(sid)) mutations.delete(sid);
    }

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
    if (disposed || !toolProvider) return false;
    const m = mutations.get(statementId);
    if (!m) return false;

    // No double submit
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
    // Keep cache and queries for a Strict Mode re-attach
    for (const q of queries.values()) {
      if (q.timer) {
        clearInterval(q.timer);
        q.timer = undefined;
      }
      q.refreshInterval = 0;
      q.loading = false;
      q.needsRefetch = false;
    }
    mutations.clear();
  }

  return {
    evaluateStatements,
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
