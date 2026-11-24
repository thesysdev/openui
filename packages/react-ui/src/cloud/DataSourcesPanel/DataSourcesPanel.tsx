"use client";

import clsx from "clsx";
import { ArrowLeft, Check, ChevronRight, Copy, Download, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { block, panelStyles, partClass } from "./dataSourcesPanel.styles";
import {
  isRecord,
  json,
  originOf,
  resolve,
  resultShape,
  resultSummary,
  unwrapResult,
  type Origin,
} from "./describe";
import type { DataSourcesPanelProps } from "./types";

const cx = partClass;

/** The app's mark for a source, when `describeSource` gives one. */
function SourceMark({ origin }: { origin: Pick<Origin, "icon"> }) {
  return origin.icon ? <span className={cx("mark")}>{origin.icon}</span> : null;
}

function IconAction({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={clsx(cx("icon-button"), className)}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
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
 * Where a dashboard's data comes from. With nothing selected it lists every query; for a selected
 * component or prop it shows its Query, the Result that came back, and its Formula.
 */
export function DataSourcesPanel({
  sources,
  selection,
  onBack,
  onClose,
  describeSource,
  className,
}: DataSourcesPanelProps) {
  /** Rows the user opened or closed; their choice beats each row's default as they move around. */
  const [rowState, setRowState] = useState<Readonly<Record<string, boolean>>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const viewKey = selection ? `${selection.id}\u0000${selection.prop ?? ""}` : "list";

  // Focus follows the view, for keyboard and screen reader users.
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      panelRef.current
        ?.querySelector<HTMLElement>("[data-heading]")
        ?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [viewKey]);
  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  const copy = async (key: string, value: unknown) => {
    try {
      await navigator.clipboard.writeText(typeof value === "string" ? value : json(value));
      setCopyFailed(false);
      setCopied(key);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopyFailed(true);
    }
  };
  const download = (value: unknown, name: string) => {
    const url = URL.createObjectURL(new Blob([json(value)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.replace(/[^\w.-]+/g, "_")}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const copyButton = (key: string, value: unknown, className?: string) => (
    <IconAction
      className={className}
      label={copied === key ? "Copied" : "Copy"}
      onClick={() => void copy(key, value)}
    >
      {/* Keyed, so the swap to the check (and back) replays its arrival. */}
      <span className={cx("swap")} key={copied === key ? "done" : "copy"}>
        {copied === key ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
      </span>
    </IconAction>
  );
  const code = (key: string, text: string) => (
    <div className={cx("code-wrap")}>
      <pre className={cx("code")}>{text}</pre>
      {copyButton(key, text, cx("code-copy"))}
    </div>
  );

  let body: ReactNode;
  let heading: ReactNode = null;
  if (!sources) {
    body = <p className={cx("help")}>Sources appear once the dashboard has rendered.</p>;
  } else if (!selection) {
    heading = (
      <h2 className={cx("title")} tabIndex={-1} data-heading>
        Sources
      </h2>
    );
    const origins = Object.entries(sources.queries).map(([name, query]) =>
      originOf(name, query, describeSource),
    );
    body = origins.length ? (
      <ul className={cx("list")} aria-label="Queries">
        {origins.map((origin) => (
          <li
            key={origin.name}
            className={cx("list-row")}
            title={`${origin.name} · ${origin.kind}`}
          >
            <span className={cx("list-label")}>{origin.name}</span>
            <span className={cx("list-kind")}>
              <SourceMark origin={origin} />
              {origin.kind}
            </span>
          </li>
        ))}
      </ul>
    ) : (
      <p className={cx("help")}>This dashboard has no queries.</p>
    );
  } else {
    const resolved = resolve(sources, selection);
    const rows: Row[] = [];
    if (resolved) {
      const many = resolved.queries.length > 1;
      resolved.queries.forEach((name, index) => {
        const origin = originOf(name, sources.queries[name]!, describeSource);
        const value = unwrapResult(origin.query.data);
        rows.push({
          id: `query:${name}`,
          label: "Query",
          note: many || resolved.viaChildren ? `${name} · ${origin.codeLabel}` : origin.codeLabel,
          // A picked number reads best from its query; a picked table or chart, from its data.
          defaultOpen: index === 0 && Boolean(selection.prop),
          content: code(`query:${name}`, origin.code),
        });
        rows.push({
          id: `result:${name}`,
          label: "Result",
          note: many || resolved.viaChildren ? name : undefined,
          defaultOpen: index === 0 && !selection.prop,
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
        });
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
    <aside ref={panelRef} className={clsx(panelStyles.root, block, className)} aria-label="Sources">
      <header className={cx("header")}>
        {selection ? (
          <IconAction label="Back to all queries" onClick={() => onBack?.()}>
            <ArrowLeft size={16} aria-hidden />
          </IconAction>
        ) : (
          heading
        )}
        {onClose && (
          <IconAction className={cx("close")} label="Close" onClick={onClose}>
            <X size={16} aria-hidden />
          </IconAction>
        )}
      </header>
      <div className={cx("body")}>
        {/* Keyed by what's picked: a new pick fades in, and its rows never move. */}
        <div
          className={cx("view")}
          key={viewKey}
          data-heading={selection ? "" : undefined}
          tabIndex={selection ? -1 : undefined}
        >
          {body}
        </div>
      </div>
      <span className={cx("sr-only")} role="status">
        {copyFailed ? "Couldn't copy. Please try again." : copied ? "Copied to clipboard" : ""}
      </span>
    </aside>
  );
}
