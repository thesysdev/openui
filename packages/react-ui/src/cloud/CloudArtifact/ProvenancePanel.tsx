"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import { IconButton } from "../../components/IconButton";
import { names, styles } from "./cloudArtifact.styles";
import { useArtifactProvenance, type ProvenanceSources } from "./contexts";

type PropSources = NonNullable<NonNullable<ProvenanceSources>["props"]>[string];
type Cell = PropSources["cell"];

const MAX_ROWS = 8;
const MAX_COLUMNS = 6;

function toJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

/** The rows of a query's result to show, and the cell a prop reads in them. */
function resultTable(data: unknown, cell: Cell) {
  let value = data;
  let i = 0;
  const path = cell?.path ?? [];
  for (; i < path.length && !Array.isArray(value); i++) {
    value = (value as Record<string | number, unknown> | null)?.[path[i]!];
  }
  // Without a cell, show the result's first list, such as `rows`.
  if (!cell && value && typeof value === "object" && !Array.isArray(value)) {
    value = Object.values(value).find(Array.isArray) ?? value;
  }
  if (!Array.isArray(value)) return null;
  const rows = value as unknown[];
  // `rows[0].revenue`, or a column read first: `@First(rows.revenue)` is `rows, revenue, 0`.
  const [a, b] = [path[i], path[i + 1]];
  const index = typeof a === "number" ? a : typeof b === "number" ? b : undefined;
  const column = typeof a === "number" ? b : a;
  const row = index === undefined ? undefined : index < 0 ? rows.length + index : index;
  const first = row !== undefined && row >= MAX_ROWS ? row - MAX_ROWS + 1 : 0;
  const shown = rows.slice(first, first + MAX_ROWS);
  const keys = [
    ...new Set(shown.flatMap((r) => (r && typeof r === "object" ? Object.keys(r) : []))),
  ];
  // The cited column always shows.
  const columns = keys.filter((k, n) => n < MAX_COLUMNS || k === column).slice(0, MAX_COLUMNS + 1);
  return { rows: shown, first, total: rows.length, columns, row, column };
}

function Result({ data, cell }: { data: unknown; cell: Cell }) {
  const table = resultTable(data, cell);
  if (!table || table.columns.length === 0) {
    return <pre className={styles.provenanceCode}>{toJson(data).slice(0, 2000)}</pre>;
  }
  return (
    <div className={styles.provenanceTableWrap}>
      <table className={styles.provenanceTable}>
        <thead>
          <tr>
            {table.columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r, k) => (
            <tr key={table.first + k}>
              {table.columns.map((c) => {
                const hit =
                  c === table.column && (table.row === undefined || table.row === table.first + k);
                return (
                  <td key={c} data-cited={hit ? "" : undefined}>
                    {String((r as Record<string, unknown>)?.[c] ?? "")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {table.total > table.rows.length && (
        <p className={styles.provenanceNote}>
          Rows {table.first + 1}–{table.first + table.rows.length} of {table.total}
        </p>
      )}
    </div>
  );
}

/**
 * The default panel, like a Sources view: for the clicked number (or the whole component), its
 * queries with their calls and results, the cited cell highlighted, the formula, and filters.
 */
export function ProvenancePanel() {
  const { selection, sources, clearSelection } = useArtifactProvenance();
  if (!selection) return null;
  const prop = selection.prop ? sources?.props?.[selection.prop] : undefined;
  const title = selection.prop
    ? `${selection.statementId} · ${selection.prop}`
    : selection.statementId;
  const shown = selection.prop ? prop : sources;
  const queryIds = new Set(
    ((shown?.queries ?? []) as Array<string | { statementId: string }>).map((q) =>
      typeof q === "string" ? q : q.statementId,
    ),
  );
  const queries = (sources?.queries ?? []).filter((q) => queryIds.has(q.statementId));
  const state = Object.entries(shown?.state ?? {});
  const formulas = Object.entries(sources?.formulas ?? {}).filter(([name]) =>
    shown?.via.includes(name),
  );

  return (
    <div className={styles.provenanceDock}>
      <aside
        className={clsx(styles.provenancePanel, names.provenancePanel)}
        aria-label="Data sources"
      >
        <div className={styles.provenanceHeader}>
          <span className={styles.provenanceTitle}>{title}</span>
          <IconButton
            variant="tertiary"
            size="small"
            icon={<X size={16} />}
            aria-label="Close data sources"
            onClick={clearSelection}
          />
        </div>
        {!sources ? (
          <p className={styles.provenanceNote}>No data sources found for this element.</p>
        ) : !shown ? (
          <p className={styles.provenanceNote}>Not set in the program: the component's default.</p>
        ) : queries.length === 0 && state.length === 0 ? (
          <p className={styles.provenanceNote}>
            Written in the program: no query or filter feeds it.
          </p>
        ) : null}
        {(prop || formulas.length > 0) && (
          <section className={styles.provenanceSection}>
            <div className={styles.provenanceLabel}>Formula</div>
            <pre className={styles.provenanceCode}>
              {[
                ...(prop ? [`${selection.prop} = ${prop.expr}`] : []),
                ...formulas.map(([name, text]) => `${name} = ${text}`),
              ].join("\n")}
            </pre>
          </section>
        )}
        {queries.map((q) => (
          <section key={q.statementId} className={styles.provenanceSection}>
            <div className={styles.provenanceLabel}>
              {q.toolName ?? q.statementId}
              {q.loading && <span className={styles.provenanceNote}> · loading</span>}
            </div>
            <div className={styles.provenanceNote}>Query {q.statementId}</div>
            <pre className={styles.provenanceCode}>{toJson(q.args)}</pre>
            <div className={styles.provenanceNote}>Result</div>
            {/* A query's defaults show while it loads: no cell is cited in them. */}
            <Result
              data={q.data}
              cell={!q.loading && prop?.cell?.query === q.statementId ? prop.cell : undefined}
            />
          </section>
        ))}
        {state.length > 0 && (
          <section className={styles.provenanceSection}>
            <div className={styles.provenanceLabel}>Filters</div>
            {state.map(([name, value]) => (
              <div key={name} className={styles.provenanceNote}>
                {name} = {toJson(value)}
              </div>
            ))}
          </section>
        )}
        {!selection.prop && sources?.props && Object.keys(sources.props).length > 0 && (
          <section className={styles.provenanceSection}>
            <div className={styles.provenanceLabel}>By prop</div>
            {Object.entries(sources.props).map(([name, p]) => (
              <div key={name} className={styles.provenanceNote}>
                {name} = {p.expr}
              </div>
            ))}
          </section>
        )}
      </aside>
    </div>
  );
}
