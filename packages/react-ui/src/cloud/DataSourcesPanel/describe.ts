import type { DataSourceQuery } from "@openuidev/react-lang";
import type { ReactNode } from "react";
import type { DataSourcesComponent, SourceDescription } from "./types";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/** A data source as the panel shows it. */
export interface Origin {
  key: string;
  toolName: string;
  args: unknown;
  kind: string;
  title: string;
  detail: string;
  code: string;
  codeLabel: string;
  icon?: ReactNode;
}

export interface Source extends Origin {
  statementId: string;
  data: unknown;
  loading: boolean;
  /** Components that read it. */
  consumers: DataSourcesComponent[];
}

export type Describe = (toolName: string, args: unknown) => SourceDescription | undefined;

/** Abbreviations agents use in names, spelled the way people read them. */
const NAME_WORDS: Record<string, string> = {
  kpi: "KPI",
  kpis: "KPIs",
  dau: "DAU",
  wau: "WAU",
  mau: "MAU",
  mrr: "MRR",
  arr: "ARR",
  nps: "NPS",
  csat: "CSAT",
  aov: "AOV",
  rev: "revenue",
  pv: "pageviews",
};

/** `kpiQ` → `KPI`, `revenue_vs_target` → `Revenue vs target`, `dailyDetail` → `Daily detail`. */
export function humanize(id: string): string {
  const words = id
    .replace(/(?<=[a-z0-9])(?:Q|Query)$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .split(/\s+/)
    .map((word) => NAME_WORDS[word.toLowerCase()] ?? word.toLowerCase())
    .join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Tables a query reads, skipping its own WITH names. */
export function tablesIn(sql: string): string[] {
  const own = new Set(
    [...sql.matchAll(/\b(\w+)\s+as\s*\(/gi)].map((match) => match[1]!.toLowerCase()),
  );
  const names = [...sql.matchAll(/\b(?:from|join)\s+([`"]?[\w$-]+(?:\.[\w$-]+)*[`"]?)/gi)]
    .map((match) => match[1]!.replace(/[`"]/g, ""))
    .filter((name) => !own.has(name.toLowerCase()));
  return [...new Set(names)];
}

/** One-line SQL, broken before its main clauses so it reads top to bottom. Display only. */
export function formatSql(sql: string): string {
  if (sql.includes("\n")) return sql.trim();
  return sql
    .trim()
    .replace(
      /\s+(?=(?:select|from|where|group by|order by|having|limit|(?:left |right |inner |full )?join|union(?: all)?)\b)/gi,
      "\n",
    )
    .replace(/\),\s*(?=\w+ as \()/gi, "),\n");
}

export const callKey = (name: string, args: unknown) => JSON.stringify([name, args ?? {}]);

/** The query text a call carries, if any: SQL, HogQL or a `query` string. */
function queryText(values: Record<string, unknown>): { code: string; label: string } | null {
  if (typeof values["sql"] === "string") return { code: values["sql"], label: "SQL" };
  if (typeof values["hogql"] === "string") return { code: values["hogql"], label: "HogQL" };
  if (typeof values["query"] === "string") return { code: values["query"], label: "Query" };
  return null;
}

/**
 * Where a call reads from, as the panel names it. The app's `describeSource` wins field by field;
 * without it, a `file` argument is a file, SQL is a query, and anything else is a request.
 */
export function originOf(
  toolName: string,
  args: unknown,
  describe: Describe | undefined,
  statementId?: string,
): Origin {
  const values = isRecord(args) ? args : {};
  const described = describe?.(toolName, args) ?? {};
  const key = callKey(toolName, args);
  const text = queryText(values);
  const name = statementId ? humanize(statementId) : humanize(toolName);
  let base: Omit<Origin, "key" | "toolName" | "args" | "icon">;
  if (typeof values["file"] === "string") {
    base = { kind: "File", title: values["file"], detail: "", code: "", codeLabel: "" };
  } else if (text) {
    const tables = text.label === "SQL" ? tablesIn(text.code) : [];
    base = {
      kind: humanize(toolName),
      title: name,
      detail: tables.join(", "),
      code: formatSql(text.code),
      codeLabel: text.label,
    };
  } else {
    const empty = Object.keys(values).length === 0;
    base = {
      kind: humanize(toolName),
      title: name,
      detail: "",
      code: empty ? "" : JSON.stringify(values, null, 2),
      codeLabel: empty ? "" : "Request",
    };
  }
  // A script is named after what it computes: its tool, not the statement holding the call.
  const scriptTitle = described.kind === "Script" ? humanize(toolName) : undefined;
  return {
    key,
    toolName,
    args,
    kind: described.kind ?? base.kind,
    title: described.title ?? scriptTitle ?? base.title,
    detail: described.detail ?? base.detail,
    code: described.code ?? base.code,
    codeLabel: described.codeLabel ?? base.codeLabel,
    icon: described.icon,
  };
}

export const isQueryCode = (origin: Pick<Origin, "codeLabel">) =>
  origin.codeLabel === "SQL" || origin.codeLabel === "HogQL" || origin.codeLabel === "Query";

/** Every source in the dashboard, each with the components that read it. */
export function collectSources(
  queries: DataSourceQuery[],
  components: DataSourcesComponent[],
  describe: Describe | undefined,
): Source[] {
  const list = queries.map<Source>((query) => ({
    ...originOf(query.toolName ?? query.statementId, query.args, describe, query.statementId),
    statementId: query.statementId,
    data: query.data,
    loading: query.loading,
    consumers: components.filter((component) => component.queries.includes(query.statementId)),
  }));
  // A query feeding one component is best named after it (`pv` → "Daily pageviews"), unless
  // the app named it, or another query feeds the same component.
  const named = list.map((source) => {
    if (!isQueryCode(source) || describe?.(source.toolName, source.args)?.title) return null;
    const labels = [...new Set(source.consumers.map((consumer) => consumer.label))];
    return labels.length === 1 ? labels[0]! : null;
  });
  return list.map((source, i) => {
    const name = named[i];
    return name && named.filter((other) => other === name).length === 1
      ? { ...source, title: name }
      : source;
  });
}

/** What a chart's source is: the tables a query reads, rather than the chart's title again. */
export function identityName(origin: Origin): string {
  if (origin.codeLabel === "SQL") return tablesIn(origin.code).join(", ") || origin.title;
  return origin.title;
}

/**
 * What a result holds, without transport wrappers: an MCP call's structuredContent, and a lone
 * list inside an object (`{ invoices: [...] }`) as the table itself.
 */
export function unwrapResult(value: unknown): unknown {
  let inner = isRecord(value) && "structuredContent" in value ? value["structuredContent"] : value;
  if (isRecord(inner)) {
    const entries = Object.entries(inner);
    if (entries.length === 1 && Array.isArray(entries[0]![1])) inner = entries[0]![1];
  }
  return inner;
}

/** A result's rows, from a list of records, `{ rows }`, or columns of equal length. */
export function resultShape(value: unknown): { rows: Record<string, unknown>[] } | null {
  const envelope = isRecord(value) && Array.isArray(value["rows"]) ? value : null;
  if (!envelope && isRecord(value)) {
    const columns = Object.values(value);
    const length = Array.isArray(columns[0]) ? columns[0].length : -1;
    const columnar =
      columns.length > 0 &&
      columns.every(
        (column) =>
          Array.isArray(column) &&
          column.length === length &&
          column.every((cell) => !isRecord(cell) && !Array.isArray(cell)),
      );
    if (columnar) {
      const entries = Object.entries(value as Record<string, unknown[]>);
      return {
        rows: Array.from({ length }, (_, index) =>
          Object.fromEntries(entries.map(([key, column]) => [key, column[index]])),
        ),
      };
    }
  }
  const rows = envelope ? envelope["rows"] : value;
  return Array.isArray(rows) && rows.every(isRecord)
    ? { rows: rows as Record<string, unknown>[] }
    : null;
}

/** `14 rows · 3 fields`. */
export function resultSummary(value: unknown): string | undefined {
  const shape = resultShape(value);
  if (!shape) return undefined;
  const fields = new Set(shape.rows.flatMap((row) => Object.keys(row))).size;
  const rows = shape.rows.length;
  return `${rows.toLocaleString()} ${rows === 1 ? "row" : "rows"} · ${fields} ${fields === 1 ? "field" : "fields"}`;
}

export const json = (value: unknown) => JSON.stringify(value, null, 2) ?? "No result yet";

/** A component that shows one number: its heading is the number's source. */
export const isMetricType = (typeName: string | undefined) =>
  typeName === "Kpi" || typeName === "Stat" || typeName === "Kpis";

/** One word for a component in "Also used by". */
export function componentKind(typeName: string): string {
  if (isMetricType(typeName)) return "Metric";
  return typeName === "Table" ? "Table" : "Chart";
}
