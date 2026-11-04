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

/**
 * Where a component's data comes from, for a "where did this number come from" view: its
 * queries, the statements in between and the `$variables` it reads, also by prop. A prop with no
 * queries and no state is written in the program. Pass the `statementId` the component gets;
 * null for an inline component (no statement). It reads the values when the component renders
 * and does not subscribe to changes.
 */
export function useDataSources(
  statementId: string | undefined,
): (Sources<DataSourceQuery> & { props?: Record<string, Sources<string>> }) | null {
  const { getParseResult, queryManager, evaluationContext } = useOpenUI();
  const result = getParseResult();
  const found = useMemo(
    () => (result && statementId ? dataSources(result, statementId) : null),
    [result, statementId],
  );
  if (!found) return null;
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
    state: values(found.state),
    props:
      found.props &&
      Object.fromEntries(
        Object.entries(found.props).map(([name, s]) => [name, { ...s, state: values(s.state) }]),
      ),
  };
}
