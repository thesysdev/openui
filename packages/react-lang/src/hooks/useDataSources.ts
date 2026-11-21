import { dataSources } from "@openuidev/lang-core";
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
 * between. Pass a statement's name (the `statementId` a component gets), or an inline id.
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
        const call = queryManager.getCall(query);
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
