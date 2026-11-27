"use client";

import type { DataSources } from "@openuidev/react-lang";
import { Database, Sigma } from "lucide-react";
import type { ReactNode } from "react";
import { DataSourcesResult, DataSourcesResultError } from "./DataSourcesContents";
import { originOf, resultSummary, unwrapResult, type Describe } from "./describe";
import { CopyButton, CopyStatus, useCopy } from "./parts";
import { queryError } from "./queryError";
import type { Source } from "./sourceIndex";
import { partClass as cx } from "./sourcesDialog.styles";

/** One source as an item's popover shows it, in its list and its detail. */
export interface SourceEntry {
  name: string;
  kind: Source["kind"];
  /** The source's logo, or a mark for its kind. */
  icon: ReactNode;
  /** Under its name in the list: the tool and what it reads (`Postgres · orders`), or for a formula, what it reads. */
  line: string;
  /** The code block's label: the query's language (`SQL`, `HogQL`), or `Formula`. */
  codeLabel: string;
  code: string;
  /** A query's result and any error. */
  result?: { value: unknown; loading: boolean; error?: string };
}

const names = (text: string) => new Set(text.match(/[A-Za-z_$][\w$]*/g) ?? []);

/**
 * A source of the program, named as the app's `describeSource` says: its kind, logo, what it
 * reads and its code's language. A formula reads the queries and formulas its text names.
 */
export function sourceEntry(
  source: Source,
  sources: DataSources,
  describe?: Describe,
): SourceEntry {
  if (source.kind === "formula") {
    const read = names(source.text);
    const reads = [...Object.keys(sources.queries), ...Object.keys(sources.formulas)].filter(
      (name) => name !== source.name && read.has(name),
    );
    return {
      name: source.name,
      kind: "formula",
      icon: <Sigma aria-hidden />,
      line: ["Formula", reads.join(", ")].filter(Boolean).join(" · "),
      codeLabel: "Formula",
      code: `${source.name} = ${source.text}`,
    };
  }
  const origin = originOf(source.name, source.query, describe);
  return {
    name: source.name,
    kind: "query",
    icon: origin.icon ?? <Database aria-hidden />,
    line: [origin.kind, origin.table].filter(Boolean).join(" · "),
    codeLabel: origin.codeLabel,
    code: origin.code,
    result: {
      value: unwrapResult(source.query.data),
      loading: source.query.loading,
      error: queryError(source.query)?.message,
    },
  };
}

function Logo({ entry }: { entry: SourceEntry }) {
  return (
    <span className={cx("source-logo")} aria-hidden>
      {entry.icon}
    </span>
  );
}

/**
 * Sources, one row each: its logo, name and what it reads, and with `count`, on its right, e.g.
 * how many items use it. A row opens its detail.
 */
export function SourceList({
  entries,
  onOpen,
  count,
}: {
  entries: SourceEntry[];
  onOpen: (name: string) => void;
  count?: (entry: SourceEntry) => string;
}) {
  return (
    <ul className={cx("source-list")} aria-label="Sources">
      {entries.map((entry) => (
        <li key={entry.name}>
          <button
            type="button"
            className={cx("source-row")}
            data-source={entry.name}
            onClick={() => onOpen(entry.name)}
          >
            <Logo entry={entry} />
            <span className={cx("source-text")}>
              <span className={cx("source-name")} data-source-name="">
                {entry.name}
              </span>
              <span className={cx("source-line")}>{entry.line}</span>
            </span>
            {count && (
              <span className={cx("source-count")} data-source-count="">
                {count(entry)}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * One source: its code (Query or Formula) with a copy button, and a query's Result. `before`
 * goes between its heading and its code, such as the All sources menu's Used by.
 */
export function SourceDetail({ entry, before }: { entry: SourceEntry; before?: ReactNode }) {
  const { copied, failed, copy } = useCopy();
  const value = entry.result?.value;
  const error = entry.result?.error;
  const summary = error === undefined && value !== undefined ? resultSummary(value) : undefined;
  return (
    <div className={cx("detail")}>
      <h3 className={cx("detail-head")} tabIndex={-1} data-heading="">
        <Logo entry={entry} />
        {entry.name}
      </h3>
      {before}
      <section className={cx("block")} aria-label={entry.codeLabel}>
        <h4 className={cx("block-label")}>{entry.codeLabel}</h4>
        <div className={cx("code-wrap")}>
          <pre className={cx("code")}>{entry.code}</pre>
          <CopyButton
            className={cx("code-copy")}
            done={copied === "code"}
            onCopy={() => void copy("code", entry.code)}
          />
        </div>
      </section>
      {entry.result && (
        // Not a region of its own: its table is the "Result" region.
        <div className={cx("block")}>
          <h4 className={cx("block-label")}>Result</h4>
          {error !== undefined ? (
            <DataSourcesResultError message={error} />
          ) : value === undefined ? (
            <p className={cx("help")}>
              {entry.result.loading
                ? "Loading…"
                : "No data came back. If the query failed, the dashboard shows why."}
            </p>
          ) : (
            <>
              <DataSourcesResult value={value} loading={entry.result.loading} />
              {summary && (
                <div className={cx("result-foot")}>
                  <span>{summary}</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
      <CopyStatus copied={copied !== null} failed={failed} />
    </div>
  );
}
