"use client";

import type { DataSources } from "@openuidev/react-lang";
import { ChevronRight, Download } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  componentLabel,
  isRecord,
  json,
  originOf,
  resolve,
  resultShape,
  resultSummary,
  unwrapResult,
  type Origin,
} from "./describe";
import { CopyButton, CopyStatus, IconAction, useCopy } from "./parts";
import { partClass } from "./sourcesDialog.styles";
import type { DataSourcesContentsProps, DataSourcesSelection } from "./types";

const cx = partClass;

/** The app's mark for a source, when `describeSource` gives one. */
function SourceMark({ origin }: { origin: Pick<Origin, "icon"> }) {
  return origin.icon ? <span className={cx("mark")}>{origin.icon}</span> : null;
}

function display(item: unknown): ReactNode {
  if (item === undefined || item === null) return <span className={cx("null")}>—</span>;
  if (typeof item === "object") return <code>{JSON.stringify(item)}</code>;
  return String(item);
}

/** A result as the source returned it: a table of its rows, or its raw value. */
export function DataSourcesResult({ value, loading }: { value: unknown; loading?: boolean }) {
  const shape = resultShape(value);
  if (!shape) {
    return isRecord(value) ? (
      <DataSourcesResult value={[value]} loading={loading} />
    ) : (
      <pre className={cx("raw")}>{json(value)}</pre>
    );
  }
  const { rows } = shape;
  if (!rows.length) {
    return <p className={cx("help")}>{loading ? "Loading…" : "No rows returned."}</p>;
  }
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const numeric = (column: string) => rows.every((row) => typeof row[column] !== "string");
  return (
    <div className={cx("table-scroll")} role="region" aria-label="Result" tabIndex={0}>
      <table className={cx("table")}>
        <caption className={cx("sr-only")}>
          {rows.length} rows, {columns.length} fields
        </caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th scope="col" key={column} data-numeric={numeric(column) || undefined}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column} data-numeric={typeof row[column] === "number" || undefined}>
                  {display(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface Row {
  id: string;
  label: string;
  note?: string;
  defaultOpen: boolean;
  content: ReactNode;
}

/**
 * The view's heading: a query opened from the list by its name; the picked component by its
 * label (see `componentLabel`), else its id; the list, "Sources".
 */
export function sourcesTitle(
  sources: DataSources | null,
  selection: DataSourcesSelection | null,
  query?: string | null,
): string {
  if (query) return query;
  if (!selection) return "Sources";
  return (sources && componentLabel(sources, selection.id)) ?? selection.id;
}

/**
 * Where a dashboard's data comes from, without a frame: the body of the Sources dialog.
 * With nothing selected it lists every query; for a selected component or prop it shows its Query,
 * the Result that came back, and its Formula; for a query opened from the list, its Query and
 * Result.
 */
export function DataSourcesContents({
  sources,
  selection,
  query = null,
  onOpenQuery,
  describeSource,
}: DataSourcesContentsProps) {
  /** Rows the user opened or closed; their choice beats each row's default as they move around. */
  const [rowState, setRowState] = useState<Readonly<Record<string, boolean>>>({});
  const { copied, failed: copyFailed, copy } = useCopy();
  const bodyRef = useRef<HTMLDivElement>(null);
  const viewKey = query
    ? `query\u0000${query}`
    : selection
      ? `${selection.id}\u0000${selection.prop ?? ""}`
      : "list";
  // Which way the view moved: into a detail is forward, back to the list is back. The first view
  // doesn't move.
  const travel = useRef<{ key: string; direction?: "forward" | "back" }>({ key: viewKey });
  if (travel.current.key !== viewKey) {
    travel.current = { key: viewKey, direction: viewKey === "list" ? "back" : "forward" };
  }

  // Focus follows the view, for keyboard and screen reader users.
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      bodyRef.current?.querySelector<HTMLElement>("[data-heading]")?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [viewKey]);
  const download = (value: unknown, name: string) => {
    const url = URL.createObjectURL(new Blob([json(value)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.replace(/[^\w.-]+/g, "_")}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const copyButton = (key: string, value: unknown, className?: string) => (
    <CopyButton className={className} done={copied === key} onCopy={() => void copy(key, value)} />
  );
  const code = (key: string, text: string) => (
    <div className={cx("code-wrap")}>
      <pre className={cx("code")}>{text}</pre>
      {copyButton(key, text, cx("code-copy"))}
    </div>
  );
  /** A query's Query and Result rows. */
  const queryRows = (
    current: DataSources,
    name: string,
    { open, labelled }: { open: "query" | "result" | null; labelled: boolean },
  ): Row[] => {
    const origin = originOf(name, current.queries[name]!, describeSource);
    const value = unwrapResult(origin.query.data);
    return [
      {
        id: `query:${name}`,
        label: "Query",
        note: labelled ? `${name} · ${origin.codeLabel}` : origin.codeLabel,
        defaultOpen: open === "query",
        content: code(`query:${name}`, origin.code),
      },
      {
        id: `result:${name}`,
        label: "Result",
        note: labelled ? name : undefined,
        defaultOpen: open === "result",
        content:
          value === undefined ? (
            <p className={cx("help")}>
              {origin.query.loading
                ? "Loading…"
                : "No data came back. If the query failed, the dashboard shows why."}
            </p>
          ) : (
            <>
              <DataSourcesResult value={value} loading={origin.query.loading} />
              <div className={cx("result-foot")}>
                <span>{resultSummary(value)}</span>
                {copyButton(`result:${name}`, value)}
                <IconAction label="Download" onClick={() => download(value, name)}>
                  <Download size={16} aria-hidden />
                </IconAction>
              </div>
            </>
          ),
      },
    ];
  };

  let body: ReactNode;
  if (!sources) {
    body = <p className={cx("help")}>Sources appear once the dashboard has rendered.</p>;
  } else if (!selection && !(query && query in sources.queries)) {
    const origins = Object.entries(sources.queries).map(([name, each]) =>
      originOf(name, each, describeSource),
    );
    body = origins.length ? (
      <ul className={cx("list")} aria-label="Queries">
        {origins.map((origin) => {
          const label = (
            <>
              <span className={cx("list-label")}>{origin.name}</span>
              <span className={cx("list-kind")}>
                <SourceMark origin={origin} />
                {origin.kind}
              </span>
            </>
          );
          return (
            <li
              key={origin.name}
              className={cx("list-row")}
              title={`${origin.name} · ${origin.kind}`}
            >
              {onOpenQuery ? (
                <button
                  type="button"
                  className={cx("list-button")}
                  onClick={() => onOpenQuery(origin.name)}
                >
                  {label}
                  <ChevronRight className={cx("chevron")} size={16} aria-hidden />
                </button>
              ) : (
                label
              )}
            </li>
          );
        })}
      </ul>
    ) : (
      <p className={cx("help")}>This dashboard has no queries.</p>
    );
  } else {
    const rows: Row[] = [];
    let resolved: ReturnType<typeof resolve> = null;
    if (!selection) {
      // A query opened from the list.
      rows.push(...queryRows(sources, query!, { open: "query", labelled: false }));
    } else {
      resolved = resolve(sources, selection);
      if (resolved) {
        const labelled = resolved.queries.length > 1 || resolved.viaChildren;
        resolved.queries.forEach((name, index) => {
          // A picked number reads best from its query; a picked table or chart, from its data.
          const open = index > 0 ? null : selection.prop ? "query" : "result";
          rows.push(...queryRows(sources, name, { open, labelled }));
        });
        // Formula: how the value is picked from its data (now = @First(…)), or the value as
        // written when nothing is read. Closed by default under a query; open on its own.
        if (resolved.formula.length) {
          rows.push({
            id: "formula",
            label: "Formula",
            defaultOpen: !resolved.queries.length,
            content: code("formula", resolved.formula.join("\n\n")),
          });
        }
      }
    }
    body = rows.length ? (
      <div className={cx("rows")}>
        {rows.map((row) => {
          const expanded = rowState[row.id] ?? row.defaultOpen;
          return (
            <section className={cx("row")} key={row.id}>
              <button
                type="button"
                className={cx("row-toggle")}
                aria-expanded={expanded}
                onClick={() => setRowState((current) => ({ ...current, [row.id]: !expanded }))}
              >
                <span className={cx("row-title")}>{row.label}</span>
                {row.note && <span className={cx("row-note")}>{row.note}</span>}
                <ChevronRight className={cx("chevron")} size={16} aria-hidden />
              </button>
              <div className={cx("disclosure")} data-open={expanded} aria-hidden={!expanded}>
                <div className={cx("disclosure-inner")}>
                  {expanded && <div className={cx("row-body")}>{row.content}</div>}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    ) : (
      <p className={cx("help")}>
        {resolved
          ? "This is written in the program, not read from data."
          : "This is no longer in the dashboard."}
      </p>
    );
  }

  return (
    <>
      <div className={cx("body")} ref={bodyRef}>
        {/* Keyed by what's shown: a new view slides in, and its rows never move. */}
        <div
          className={cx("view")}
          key={viewKey}
          data-heading=""
          data-direction={travel.current.direction}
          tabIndex={-1}
        >
          {body}
        </div>
      </div>
      <CopyStatus copied={copied !== null} failed={copyFailed} />
    </>
  );
}
