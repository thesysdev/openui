import { dataSources, isElementNode, type ElementNode } from "@openuidev/lang-core";
import { useMemo } from "react";
import { useOpenUI } from "../context";
import { useRendererQuery } from "../Renderer";

/** A query a component reads: the call it last ran with, whether it is loading, and its result. */
export interface DataSourceQuery {
  statementId: string;
  toolName: string | undefined;
  /** The call it last ran, or is running: while `loading`, `data` is still the previous result (or the query's defaults). */
  args: unknown;
  loading: boolean;
  data: unknown;
}

interface Sources<Q> {
  queries: Q[];
  /** Statements between the component and its queries, e.g. `latest = @Last(weekly.rows)`. */
  via: string[];
  /** The `$variables` it reads, with their current values. */
  state: Record<string, unknown>;
}

/** A prop's sources, with its expression as written. */
export interface PropDataSources extends Sources<string> {
  /** The argument as written, e.g. `now.revenue`. */
  expr: string;
}

/** Where a component's data comes from: what `useDataSources` returns. */
export interface DataSources extends Sources<DataSourceQuery> {
  /** The text of each statement in `via`, e.g. `{ now: "@First(totals.rows)" }`. */
  formulas: Record<string, string>;
  props?: Record<string, PropDataSources>;
}

/**
 * Where a component's data comes from, for a "where did this number come from" view: its
 * queries, the statements in between and the `$variables` it reads, also by prop. A prop with no
 * queries and no state is written in the program; `formulas` holds the text of the statements in
 * between. Pass a statement's name (the `statementId` a component gets), or a component id (`lead.2`).
 * It reads the values whenever the Renderer updates. The result keeps its identity until the
 * program, a store value or a query result changes, so it can be passed to effects.
 */
export function useDataSources(id: string | undefined): DataSources | null {
  const context = useOpenUI();
  // Re-render on every Renderer update, so a new parse is read even when the caller's own props
  // did not change.
  useRendererQuery();
  const result = context.getParseResult();
  const found = useMemo(() => (result && id ? dataSources(result, id) : null), [result, id]);
  // The context changes on every store write and query result.
  return useMemo(() => {
    if (!found) return null;
    const { queryManager, evaluationContext } = context;
    const values = (names: string[]) =>
      Object.fromEntries(names.map((name) => [name, evaluationContext.getState(name)]));
    return {
      queries: found.queries.map((query) => {
        const call = queryManager.getCall?.(query) ?? null;
        return {
          statementId: query,
          toolName: call?.toolName,
          args: call?.args,
          loading: queryManager.isLoading(query),
          data: queryManager.getResult(query),
        };
      }),
      via: found.via,
      formulas: found.formulas,
      state: values(found.state),
      props:
        found.props &&
        Object.fromEntries(
          Object.entries(found.props).map(([name, s]) => [name, { ...s, state: values(s.state) }]),
        ),
    };
  }, [found, context]);
}

/** A component in the program, for an index of what reads what. */
export interface DataSourceIndexEntry {
  /** Its statement name, or its component id (`lead.1`) when it is written inside one. */
  id: string;
  typeName: string;
  /** Its props as parsed; literal ones are plain values. */
  props: Record<string, unknown>;
  /** The Query statements it reads. */
  queries: string[];
}

/** Every query in the program and every component with the queries it reads. */
export interface DataSourceIndex {
  queries: DataSourceQuery[];
  components: DataSourceIndexEntry[];
}

const EMPTY_INDEX: DataSourceIndex = Object.freeze({ queries: [], components: [] });

/** The element nodes in a parsed value: a node, a list, or an object's values. */
function forEachElement(value: unknown, visit: (node: ElementNode) => void, depth = 0): void {
  if (depth > 64 || !value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item) => forEachElement(item, visit, depth + 1));
    return;
  }
  if (isElementNode(value)) {
    visit(value);
    Object.values(value.props).forEach((prop) => forEachElement(prop, visit, depth + 1));
    return;
  }
  Object.values(value).forEach((item) => forEachElement(item, visit, depth + 1));
}

/**
 * Every query in the program, with its call and result, and every component with the queries it
 * reads: for a list of a dashboard's sources, and for "what else reads this". It reads the values
 * whenever the Renderer updates, like `useDataSources`.
 */
export function useDataSourceIndex(): DataSourceIndex {
  const context = useOpenUI();
  useRendererQuery();
  const result = context.getParseResult();
  const components = useMemo(() => {
    if (!result) return [];
    const entries: DataSourceIndexEntry[] = [];
    const seen = new Set<string>();
    forEachElement(result.root, (node) => {
      const id = node.statementId ?? node.componentId;
      if (!id || seen.has(id)) return;
      seen.add(id);
      entries.push({
        id,
        typeName: node.typeName,
        props: node.props,
        queries: dataSources(result, id)?.queries ?? [],
      });
    });
    return entries;
  }, [result]);
  return useMemo(() => {
    if (!result) return EMPTY_INDEX;
    const { queryManager } = context;
    return {
      queries: result.queryStatements.map(({ statementId }) => {
        const call = queryManager.getCall?.(statementId) ?? null;
        return {
          statementId,
          toolName: call?.toolName,
          args: call?.args,
          loading: queryManager.isLoading(statementId),
          data: queryManager.getResult(statementId),
        };
      }),
      components,
    };
  }, [result, components, context]);
}
