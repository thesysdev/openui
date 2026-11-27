import { dataSources, type OpenUIError, type ProgramSources } from "@openuidev/lang-core";
import { useMemo } from "react";
import { useOpenUI } from "../context";
import { useRendererQuery } from "../Renderer";

/** A query: the call it last ran with, its loading flag, result and any error. */
export interface DataSourceQuery {
  toolName: string | undefined;
  /** The call it last ran, or is running: while `loading`, `data` is still the previous result (or the query's defaults). */
  args: unknown;
  loading: boolean;
  data: unknown;
  error?: OpenUIError;
}

/** Where the program's data comes from, with live values: what `useDataSources` returns. */
export interface DataSources extends ProgramSources {
  /** Every query, in statement order. */
  queries: Record<string, DataSourceQuery>;
  /** Each `$variable`'s current value. */
  state: Record<string, unknown>;
}

/**
 * Where the program's data comes from, for a "where did this come from" view: each component's
 * and prop's queries, formula and `$variables` (lang-core's `dataSources`), with each query's
 * call, loading flag, result and any error, and each `$variable`'s value. Call it inside `Renderer`.
 * It reads the values whenever the Renderer updates, and keeps its identity until the program, a
 * store value or a query result changes, so it can be passed to effects.
 */
export function useDataSources(): DataSources | null {
  const context = useOpenUI();
  // Re-render on every Renderer update, so a new parse is read even when the caller's own props
  // did not change.
  const { errors } = useRendererQuery();
  const result = context.getParseResult();
  // Built once per parse.
  const found = result ? dataSources(result) : null;
  // The context changes on every store write and query result.
  return useMemo(() => {
    if (!found || !result) return null;
    const { queryManager, evaluationContext } = context;
    const errorsByStatement = new Map(errors.map((error) => [error.statementId, error]));
    return {
      ...found,
      queries: Object.fromEntries(
        result.queryStatements.map(({ statementId: name }) => {
          const call = queryManager.getCall?.(name) ?? null;
          const query: DataSourceQuery = {
            toolName: call?.toolName,
            args: call?.args,
            loading: queryManager.isLoading(name),
            data: queryManager.getResult(name),
            error: errorsByStatement.get(name),
          };
          return [name, query];
        }),
      ),
      state: Object.fromEntries(
        Object.keys(result.stateDeclarations).map((name) => [
          name,
          evaluationContext.getState(name),
        ]),
      ),
    };
  }, [found, result, context, errors]);
}
