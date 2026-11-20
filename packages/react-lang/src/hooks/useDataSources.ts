import { dataSources } from "@openuidev/lang-core";
import { useMemo } from "react";
import { useOpenUI } from "../context";

/** A query a component reads: the call it last ran with, whether it is loading, and its result. */
interface DataSourceQuery {
  statementId: string;
  toolName: string | undefined;
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
interface PropSources extends Sources<string> {
  expr: string;
}

/**
 * Where a component's data comes from, for a "where did this number come from" view: its
 * queries, the statements in between and the `$variables` it reads, also by prop. A prop with no
 * queries and no state is written in the program; `formulas` holds the text of the statements in
 * between. Pass the `statementId` the component gets, or an inline component's `inlineId`. It
 * reads the values when the component renders
 * and does not subscribe to changes. The result keeps its identity until the program, a store
 * value or a query result changes, so it can be passed to effects.
 */
export function useDataSources(statementId: string | undefined):
  | (Sources<DataSourceQuery> & {
      formulas: Record<string, string>;
      props?: Record<string, PropSources>;
    })
  | null {
  const context = useOpenUI();
  const result = context.getParseResult();
  const found = useMemo(
    () => (result && statementId ? dataSources(result, statementId) : null),
    [result, statementId],
  );
  // The context changes on every store write and query result.
  return useMemo(() => {
    if (!found) return null;
    const { queryManager, evaluationContext } = context;
    const values = (names: string[]) =>
      Object.fromEntries(names.map((name) => [name, evaluationContext.getState(name)]));
    return {
      queries: found.queries.map((id) => {
        const call = queryManager.getCall(id);
        return {
          statementId: id,
          toolName: call?.toolName,
          args: call?.args,
          loading: queryManager.isLoading(id),
          data: queryManager.getResult(id),
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
