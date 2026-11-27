import type { DataSourceQuery, DataSources, OpenUIError } from "@openuidev/react-lang";

/** A query, with the failure the renderer reported for it when its last fetch failed. */
export type SourceQuery = DataSourceQuery & { error?: OpenUIError };

/** The failure the renderer reported for a query, if any. */
export const queryError = (query: DataSourceQuery): OpenUIError | undefined =>
  (query as SourceQuery).error;

/** The sources, with each failed query's error (from `useRendererQuery().errors`) on its query. */
export function withQueryErrors(
  sources: DataSources | null,
  errors: OpenUIError[],
): DataSources | null {
  if (!sources || errors.length === 0) return sources;
  const queries: Record<string, SourceQuery> = { ...sources.queries };
  for (const error of errors) {
    const query = error.statementId ? queries[error.statementId] : undefined;
    if (query) queries[error.statementId!] = { ...query, error };
  }
  return { ...sources, queries };
}
