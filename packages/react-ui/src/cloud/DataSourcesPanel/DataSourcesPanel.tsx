"use client";

import clsx from "clsx";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CodeXml,
  Copy,
  Database,
  Download,
  FileText,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { block, panelStyles, partClass } from "./dataSourcesPanel.styles";
import {
  callKey,
  collectSources,
  componentKind,
  humanize,
  identityName,
  isMetricType,
  isQueryCode,
  isRecord,
  json,
  originOf,
  resultShape,
  resultSummary,
  unwrapResult,
  type Origin,
  type Source,
} from "./describe";
import type { DataSourcesComponent, DataSourcesPanelProps, ScriptCall } from "./types";

const cx = partClass;

type View =
  | { kind: "list" }
  | { kind: "source"; id: string }
  | { kind: "element" }
  | { kind: "input"; source: string; call: ScriptCall };

/** A source's mark: the app's icon, else a file, script or database glyph. */
function SourceMark({ origin }: { origin: Pick<Origin, "kind" | "icon"> }) {
  if (origin.icon) return <span className={cx("mark")}>{origin.icon}</span>;
  const Glyph = origin.kind === "File" ? FileText : origin.kind === "Script" ? CodeXml : Database;
  return <Glyph className={cx("mark")} size={14} strokeWidth={1.7} aria-hidden />;
}

/** The marks of several sources side by side, each kind shown once. */
function MarkStack({ items }: { items: Pick<Origin, "kind" | "icon" | "toolName">[] }) {
  const seen = new Set<string>();
  const unique = items.filter((item) => {
    const key = item.icon ? item.toolName : item.kind;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (!unique.length) return null;
  return (
    <span className={cx("mark-stack")} aria-hidden>
      {unique.map((item) => (
        <SourceMark key={item.icon ? item.toolName : item.kind} origin={item} />
      ))}
    </span>
  );
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
  if (typeof item === "string" && /^\d{4}-\d{2}-\d{2}T/.test(item)) {
    return item
      .replace(/T00:00:00(?:\.000)?Z?$/, "")
      .replace("T", " ")
      .replace(/:\d{2}(?:\.\d+)?Z?$/, "");
  }
  if (typeof item === "object") return <code>{JSON.stringify(item)}</code>;
  return String(item);
}

/** A result as the source returned it: one row reads as fields, more as a table. */
export function DataSourcesResult({ value }: { value: unknown }) {
  const shape = resultShape(value);
  if (!shape) {
    return isRecord(value) ? (
      <dl className={cx("fields")}>
        {Object.entries(value).map(([key, item]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{display(item)}</dd>
          </div>
        ))}
      </dl>
    ) : (
      <pre className={cx("raw")}>{json(value)}</pre>
    );
  }
  const { rows } = shape;
  if (!rows.length) return <p className={cx("help")}>No rows returned.</p>;
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  if (rows.length === 1) {
    const row = rows[0]!;
    return (
      <dl className={cx("fields")}>
        {columns.map((column) => (
          <div key={column}>
            <dt>{column}</dt>
            <dd data-numeric={typeof row[column] === "number" || undefined}>
              {display(row[column])}
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <div className={cx("table-scroll")} role="region" aria-label="Result" tabIndex={0}>
      <table className={cx("table")}>
        <caption className={cx("sr-only")}>
          {rows.length} rows, {columns.length} fields
        </caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th scope="col" key={column}>
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

/**
 * Where a dashboard's data comes from. With nothing selected it lists every source; with a
 * component selected it shows that component, the source it reads, the query and its data, and
 * the other components that read the same data.
 */
export function DataSourcesPanel({
  queries,
  components,
  selection,
  sources,
  onSelect,
  onClearSelection,
  onClose,
  describeSource,
  scriptInputs,
  runCall,
  className,
}: DataSourcesPanelProps) {
  const [view, setView] = useState<View>(selection ? { kind: "element" } : { kind: "list" });
  /** Where Back goes: the views opened before this one. */
  const [trail, setTrail] = useState<View[]>([]);
  /** Rows the user opened or closed; their choice beats each row's default as they move around. */
  const [rowState, setRowState] = useState<Readonly<Record<string, boolean>>>({});
  const [filter, setFilter] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const [inputData, setInputData] = useState<Record<string, { data?: unknown; error?: string }>>(
    {},
  );
  const panelRef = useRef<HTMLElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allSources = useMemo(
    () => collectSources(queries, components, describeSource),
    [queries, components, describeSource],
  );

  // A new selection shows that component; clearing it goes back to the list.
  const selectionKey = selection ? `${selection.id}\u0000${selection.prop ?? ""}` : null;
  useEffect(() => {
    setTrail([]);
    setView(selectionKey ? { kind: "element" } : { kind: "list" });
  }, [selectionKey]);

  // Focus follows the view: the search on the list, else the heading.
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      panelRef.current
        ?.querySelector<HTMLElement>(`.${block}__search input, [data-heading]`)
        ?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [view]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  // A script's input isn't a Query of the dashboard, so its data is fetched on demand.
  const inputKey = view.kind === "input" ? callKey(view.call.name, view.call.args) : null;
  const inputCall = view.kind === "input" ? view.call : null;
  useEffect(() => {
    if (!inputKey || !inputCall || inputData[inputKey]) return;
    if (!runCall) {
      setInputData((current) => ({
        ...current,
        [inputKey]: { error: "This app doesn't show a script's inputs." },
      }));
      return;
    }
    let cancelled = false;
    runCall(inputCall).then(
      (data) => !cancelled && setInputData((current) => ({ ...current, [inputKey]: { data } })),
      (error: unknown) =>
        !cancelled &&
        setInputData((current) => ({
          ...current,
          [inputKey]: {
            error: error instanceof Error ? error.message : "Couldn't load this data.",
          },
        })),
    );
    return () => {
      cancelled = true;
    };
  }, [inputKey, inputCall, inputData, runCall]);

  const copy = async (value: unknown) => {
    const text = typeof value === "string" ? value : json(value);
    try {
      await navigator.clipboard.writeText(text);
      setCopyFailed(false);
      setCopied(text);
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

  /* Navigation: each step remembers where it came from, so Back retraces it. */
  const go = (next: View) => {
    setTrail((current) => [...current, view]);
    setView(next);
  };
  const showList = () => {
    setTrail([]);
    setView({ kind: "list" });
    if (selection) onClearSelection?.();
  };
  const back = () => {
    const previous = trail.at(-1);
    if (!previous || previous.kind === "list") return showList();
    setTrail(trail.slice(0, -1));
    setView(previous);
  };
  const openSource = (item: Source) => go({ kind: "source", id: item.statementId });

  // ── Building blocks ──
  const copyButton = (value: unknown, className?: string) => {
    const text = typeof value === "string" ? value : json(value);
    const done = copied === text;
    return (
      <IconAction
        className={className}
        label={done ? "Copied" : "Copy"}
        onClick={() => void copy(value)}
      >
        {done ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
      </IconAction>
    );
  };
  const downloadButton = (value: unknown, name: string) => (
    <IconAction label="Download" onClick={() => download(value, name)}>
      <Download size={16} aria-hidden />
    </IconAction>
  );

  /**
   * One collapsible row. Each has a default; whatever the user opens or closes wins, and
   * carries over as they move between components.
   */
  const row = (
    id: string,
    label: ReactNode,
    content: ReactNode,
    { note, defaultOpen = false }: { note?: string; defaultOpen?: boolean } = {},
  ) => {
    const expanded = rowState[id] ?? defaultOpen;
    return (
      <section className={cx("row")} key={id}>
        <button
          type="button"
          className={cx("row-toggle")}
          aria-expanded={expanded}
          onClick={() => setRowState((current) => ({ ...current, [id]: !expanded }))}
        >
          <span className={cx("row-title")}>{label}</span>
          {note && <span className={cx("row-note")}>{note}</span>}
          <ChevronRight className={cx("chevron")} size={16} aria-hidden />
        </button>
        <div className={cx("disclosure")} data-open={expanded} aria-hidden={!expanded}>
          <div className={cx("disclosure-inner")}>
            {expanded && <div className={cx("row-body")}>{content}</div>}
          </div>
        </div>
      </section>
    );
  };

  const code = (text: string) => (
    <div className={cx("code-wrap")}>
      <pre className={cx("code")}>{text}</pre>
      {copyButton(text, cx("code-copy"))}
    </div>
  );

  const resultRow = (raw: unknown, name: string, label: string, state: string, open = false) => {
    const value = unwrapResult(raw);
    return row(
      "result",
      label,
      value === undefined ? (
        <p className={cx("help")}>{state}</p>
      ) : (
        <>
          <DataSourcesResult value={value} />
          <div className={cx("result-foot")}>
            <span>{resultSummary(value)}</span>
            {copyButton(value)}
            {downloadButton(value, name)}
          </div>
        </>
      ),
      { defaultOpen: open },
    );
  };

  const requestRow = (origin: Origin) => {
    if (!origin.code) return null;
    const isQuery = isQueryCode(origin);
    return row("query", isQuery ? "Query" : origin.codeLabel, code(origin.code), {
      note: isQuery ? origin.codeLabel : undefined,
    });
  };

  /** A source in a list: its name, then its mark. */
  const sourceLink = (item: Origin, onClick: () => void) => (
    <button
      type="button"
      className={cx("list-row")}
      title={[item.title, item.kind, item.detail].filter(Boolean).join(" · ")}
      onClick={onClick}
    >
      <span className={cx("list-label")}>{item.title}</span>
      <span className={cx("list-kind")}>
        <SourceMark origin={item} />
        <span className={cx("sr-only")}>{item.kind}</span>
      </span>
    </button>
  );

  const inputsOf = (item: Source) =>
    (item.kind === "Script" ? scriptInputs?.(item.toolName) : undefined) ?? undefined;

  const scriptRow = (item: Source, open = false) => {
    const inputs = inputsOf(item);
    return row(
      "script",
      <>
        Script
        <MarkStack
          items={(inputs ?? []).map((call) => originOf(call.name, call.args, describeSource))}
        />
      </>,
      inputs?.length ? (
        <ul className={cx("list")}>
          {inputs.map((call) => {
            const origin = originOf(call.name, call.args, describeSource);
            return (
              <li key={origin.key}>
                {sourceLink(origin, () => go({ kind: "input", source: item.statementId, call }))}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={cx("help")}>
          {inputs ? "This script reads no data source." : "What this script reads isn't known."}
        </p>
      ),
      { defaultOpen: open },
    );
  };

  /** A source's rows: what a script reads, or its query or request; then its result. */
  const sourceRows = (item: Source, scriptOpen = false) => (
    <>
      {item.kind === "Script" ? scriptRow(item, scriptOpen) : requestRow(item)}
      {resultRow(
        item.data,
        item.title,
        item.kind === "File" ? "File" : "Result",
        item.loading
          ? "Loading…"
          : "No data came back. If the query failed, the dashboard shows why.",
      )}
    </>
  );

  /** A chart's or table's source, open by default: who it is, then a preview of its data. */
  const sourceCard = (item: Source) => {
    const value = unwrapResult(item.data);
    return row(
      "source",
      <>
        Source
        <MarkStack items={[item]} />
      </>,
      <>
        <div className={cx("identity")}>
          <button
            type="button"
            className={cx("identity-name")}
            onClick={() => openSource(item)}
            title="Open this source"
          >
            {identityName(item)}
          </button>
          {value !== undefined && (
            <>
              {copyButton(value)}
              {downloadButton(value, item.title)}
            </>
          )}
        </div>
        {value === undefined ? (
          <p className={cx("help")}>
            {item.loading
              ? "Loading…"
              : "No data came back. If the query failed, the dashboard shows why."}
          </p>
        ) : (
          <>
            <DataSourcesResult value={value} />
            <div className={cx("result-foot")}>
              <span>{resultSummary(value)}</span>
            </div>
          </>
        )}
      </>,
      { defaultOpen: true },
    );
  };

  /** Other components that read the same data; each selects that component. */
  const usedByRow = (consumers: DataSourcesComponent[], label: string, current?: string) => {
    const unique = consumers.filter(
      (consumer, index, all) =>
        all.findIndex(
          (other) =>
            other.label === consumer.label &&
            componentKind(other.typeName) === componentKind(consumer.typeName),
        ) === index,
    );
    const currentLabel = current ? components.find((item) => item.id === current)?.label : null;
    const elsewhere = current
      ? unique.filter((consumer) => consumer.id !== current && consumer.label !== currentLabel)
      : unique;
    if (!elsewhere.length) return null;
    return row(
      "used",
      label,
      <ul className={cx("list")}>
        {unique.map((consumer) => (
          <li key={consumer.id}>
            <button
              type="button"
              className={cx("list-row")}
              title={consumer.label}
              data-active={consumer.id === current || undefined}
              onClick={() => onSelect?.(consumer.id)}
            >
              <span className={cx("list-label")}>{consumer.label}</span>
              <span className={cx("list-kind")}>{componentKind(consumer.typeName)}</span>
            </button>
          </li>
        ))}
      </ul>,
      { note: String(unique.length) },
    );
  };

  const heading = (title: string, meta?: string) => (
    <>
      <h2 className={cx("title")} tabIndex={-1} data-heading>
        {title}
      </h2>
      {meta && <p className={cx("meta")}>{meta}</p>}
    </>
  );

  // ── Views ──
  let body: ReactNode;
  const source =
    view.kind === "source" || view.kind === "input"
      ? allSources.find(
          (item) => item.statementId === (view.kind === "source" ? view.id : view.source),
        )
      : undefined;

  if (view.kind === "element" && selection) {
    const component = components.find((item) => item.id === selection.id);
    const label = component?.label ?? humanize(selection.id);
    const propSources = selection.prop ? sources?.props?.[selection.prop] : undefined;
    const queryIds = propSources
      ? propSources.queries
      : (sources?.queries.map((query) => query.statementId) ?? []);
    const elementSources = queryIds
      .map((id) => allSources.find((item) => item.statementId === id))
      .filter((item): item is Source => item !== undefined);
    const first = elementSources[0];
    const single = elementSources.length === 1 ? first : undefined;
    const metric = selection.prop !== undefined || isMetricType(component?.typeName);
    const consumers = [
      ...(component ? [component] : []),
      ...elementSources.flatMap((item) => item.consumers),
    ];

    // No query: the formula it is computed with, or the value as written.
    const via = propSources ? propSources.via : (sources?.via ?? []);
    const written =
      !first && !via.length && !Object.keys(propSources?.state ?? sources?.state ?? {}).length;
    const formulaText = [
      selection.prop && propSources ? `${selection.prop}: ${propSources.expr}` : "",
      ...via.map((name) => `${name} = ${sources?.formulas[name] ?? ""}`),
    ]
      .filter(Boolean)
      .join("\n\n");
    const formula =
      !first &&
      row(
        "formula",
        "Formula",
        formulaText ? code(formulaText) : <p className={cx("help")}>Written in the program.</p>,
        { defaultOpen: true },
      );
    const manySources =
      elementSources.length > 1 &&
      row(
        "sources",
        <>
          Sources
          <MarkStack items={elementSources} />
        </>,
        <ul className={cx("list")}>
          {elementSources.map((item) => (
            <li key={item.statementId}>{sourceLink(item, () => openSource(item))}</li>
          ))}
        </ul>,
        { defaultOpen: true },
      );
    const computedHeading = written
      ? heading("Written in the program", "Not read from data")
      : heading("Computed in the dashboard", "From the dashboard's own program, not a data source");

    if (metric) {
      // A number: the heading is its source, which already says where it came from.
      body = (
        <>
          {elementSources.length > 1
            ? heading(
                `${elementSources.length} sources`,
                [...new Set(elementSources.map((item) => item.kind))].join(" and "),
              )
            : first
              ? heading(first.title, [first.kind, first.detail].filter(Boolean).join(" · "))
              : computedHeading}
          {/* Keyed by the selection: switching replays a brief, subtle arrival. */}
          <div className={cx("focus")} key={selectionKey}>
            <div className={cx("focus-value")}>{selection.value || "—"}</div>
            <div className={cx("focus-label")}>{label}</div>
            {component?.description && (
              <div className={cx("focus-hint")}>{component.description}</div>
            )}
          </div>
          <div className={cx("rows")}>
            {manySources}
            {single ? sourceRows(single) : formula}
            {usedByRow(consumers, "Also used by", selection.id)}
          </div>
        </>
      );
    } else {
      // A chart or table: the heading is the component itself, so its source opens below it.
      body = (
        <>
          <div className={clsx(cx("focus"), cx("focus-heading"))} key={selectionKey}>
            {heading(label, component?.description)}
          </div>
          <div className={cx("rows")}>
            {manySources}
            {single ? (
              single.kind === "Script" ? (
                sourceRows(single, true)
              ) : (
                <>
                  {sourceCard(single)}
                  {requestRow(single)}
                </>
              )
            ) : (
              formula
            )}
            {usedByRow(consumers, "Also used by", selection.id)}
          </div>
        </>
      );
    }
  } else if (view.kind === "input" && source) {
    const origin = originOf(view.call.name, view.call.args, describeSource);
    const loaded = inputData[origin.key];
    body = (
      <>
        {heading(
          origin.title,
          [origin.kind, origin.detail, `read by ${source.title}`].filter(Boolean).join(" · "),
        )}
        <div className={cx("rows")}>
          {requestRow(origin)}
          {resultRow(
            loaded?.data,
            origin.title,
            origin.kind === "File" ? "File" : "Result",
            loaded?.error ?? "Loading…",
            true,
          )}
        </div>
      </>
    );
  } else if (view.kind === "source" && source) {
    body = (
      <>
        {heading(
          source.title,
          [source.kind, source.detail].filter(Boolean).join(" · ") +
            (source.loading ? " · Updating…" : ""),
        )}
        <div className={cx("rows")}>
          {sourceRows(source)}
          {usedByRow(source.consumers, "Used by")}
        </div>
      </>
    );
  } else {
    const query = filter.trim().toLowerCase();
    const listed = query
      ? allSources.filter((item) =>
          [item.title, item.kind, item.detail, ...item.consumers.map((c) => c.label)].some((text) =>
            text.toLowerCase().includes(query),
          ),
        )
      : allSources;
    body = (
      <>
        <div className={cx("search-bar")}>
          <label className={cx("search")}>
            <Search size={14} aria-hidden />
            <input
              aria-label="Search sources"
              placeholder="Find a source…"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </label>
        </div>
        <ul className={cx("list")} aria-label="Sources">
          {listed.map((item) => (
            <li key={item.statementId}>{sourceLink(item, () => openSource(item))}</li>
          ))}
        </ul>
        {!allSources.length && (
          <p className={cx("help")}>Sources appear once the dashboard has rendered.</p>
        )}
        {allSources.length > 0 && !listed.length && (
          <p className={cx("help")} role="status">
            No sources match “{filter}”.
          </p>
        )}
      </>
    );
  }

  const atList = view.kind === "list" || (view.kind === "element" && !selection);
  return (
    <aside
      ref={panelRef}
      className={clsx(panelStyles.root, block, className)}
      aria-label="Sources panel"
    >
      <header className={cx("header")}>
        {atList ? (
          <span>Sources</span>
        ) : (
          <IconAction label="Back" onClick={back}>
            <ArrowLeft size={16} aria-hidden />
          </IconAction>
        )}
        {onClose && (
          <IconAction className={cx("close")} label="Close" onClick={onClose}>
            <X size={16} aria-hidden />
          </IconAction>
        )}
      </header>
      <div className={cx("body")}>{body}</div>
      <span className={cx("sr-only")} role="status">
        {copyFailed ? "Couldn't copy. Please try again." : copied ? "Copied to clipboard" : ""}
      </span>
    </aside>
  );
}
