import { dataSources, type ProgramSources } from "@openuidev/lang-core";
import { useMemo } from "react";
import { useOpenUI } from "../context";
import { useRendererQuery } from "../Renderer";

/** A query: the components that read it, the call it last ran with, its loading flag and result. */
export interface DataSourceQuery {
  usedBy: string[];
  toolName: string | undefined;
  /** The call it last ran, or is running: while `loading`, `data` is still the previous result (or the query's defaults). */
  args: unknown;
  loading: boolean;
  data: unknown;
}

/** Where the program's data comes from, with live values: what `useDataSources` returns. */
export interface DataSources extends Omit<ProgramSources, "queries"> {
  queries: Record<string, DataSourceQuery>;
  /** Each `$variable`'s current value. */
  state: Record<string, unknown>;
}

/**
 * Where the program's data comes from, for a "where did this come from" view: each component's
 * and prop's queries, formula and `$variables` (lang-core's `dataSources`), with each query's
 * readers, call, loading flag and result, and each `$variable`'s value. Call it inside `Renderer`.
 * It reads the values whenever the Renderer updates, and keeps its identity until the program, a
 * store value or a query result changes, so it can be passed to effects.
 */
export function useDataSources(): DataSources | null {
  const context = useOpenUI();
  // Re-render on every Renderer update, so a new parse is read even when the caller's own props
  // did not change.
  useRendererQuery();
  const result = context.getParseResult();
  // Built once per parse.
  const found = result ? dataSources(result) : null;
  // The context changes on every store write and query result.
  return useMemo(() => {
    if (!found || !result) return null;
    const { queryManager, evaluationContext } = context;
    return {
      ...found,
      queries: Object.fromEntries(
        Object.entries(found.queries).map(([name, { usedBy }]) => {
          const call = queryManager.getCall?.(name) ?? null;
          const query: DataSourceQuery = {
            usedBy,
            toolName: call?.toolName,
            args: call?.args,
            loading: queryManager.isLoading(name),
            data: queryManager.getResult(name),
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
  }, [found, result, context]);
}
