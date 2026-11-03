import { dataSources, evaluate } from "@openuidev/lang-core";
import { useMemo } from "react";
import { useOpenUI } from "../context";

/** A query a component reads: its tool, its arguments now, and its current result. */
interface DataSourceQuery {
  statementId: string;
  tool: unknown;
  args: unknown;
  data: unknown;
}

/** Where a component's data comes from. */
interface ComponentDataSources {
  queries: DataSourceQuery[];
  /** Statements between the component and its queries, e.g. `latest = @Last(weekly.rows)`. */
  via: string[];
  /** The `$variables` it reads, with their current values. */
  state: Record<string, unknown>;
  /** The same by prop, as names only (`state` too). `literal`: the prop reads nothing, its value is written in the program. */
  props?: Record<string, { queries: string[]; via: string[]; state: string[]; literal: boolean }>;
}

/**
 * Where a component's data comes from, for a "where did this number come from" view.
 * Pass the `statementId` the component gets. Null for an inline component (no statement).
 * Values are read when the component renders; the hook does not subscribe to changes.
 */
export function useDataSources(statementId: string | undefined): ComponentDataSources | null {
  const { getParseResult, evaluationContext } = useOpenUI();
  const result = getParseResult?.();
  const found = useMemo(
    () =>
      result && statementId ? dataSources(result, statementId, evaluationContext.actions) : null,
    [result, statementId, evaluationContext.actions],
  );
  if (!result || !found) return null;
  const { queries, via, state, props } = found;
  return {
    queries: queries.map((id) => {
      const query = result.queryStatements.find((q) => q.statementId === id);
      return {
        statementId: id,
        tool: query?.toolAST ? evaluate(query.toolAST, evaluationContext) : undefined,
        args: query?.argsAST ? evaluate(query.argsAST, evaluationContext) : undefined,
        data: evaluationContext.resolveRef(id),
      };
    }),
    via,
    state: Object.fromEntries(state.map((name) => [name, evaluationContext.getState(name)])),
    props,
  };
}
