import type { DataSourceQuery, DataSources } from "@openuidev/react-lang";
import type { ReactNode } from "react";
import type { DataSourcesSelection, SourceDescription } from "./types";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export type Describe = (toolName: string, args: unknown) => SourceDescription | undefined;

/** A query as the panel shows it. */
export interface Origin {
  name: string;
  toolName: string;
  kind: string;
  code: string;
  codeLabel: string;
  icon?: ReactNode;
  query: DataSourceQuery;
}

/** `postgres_query` → `Postgres query`, `revenueVsTarget` → `Revenue vs target`. */
export function humanize(id: string): string {
  const words = id
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** One-line SQL, broken before its main clauses so it reads top to bottom. Display only. */
export function formatSql(sql: string): string {
  if (sql.includes("\n")) return sql.trim();
  return sql
    .trim()
    .replace(
      /\s+(?=(?:select|from|where|group by|order by|having|limit|(?:left |right |inner |full )?join|union(?: all)?)\b)/gi,
      "\n",
    );
}

/** The query text a call carries, if any: SQL, HogQL or a `query` string. */
function queryText(values: Record<string, unknown>): { code: string; label: string } | null {
  if (typeof values["sql"] === "string") return { code: values["sql"], label: "SQL" };
  if (typeof values["hogql"] === "string") return { code: values["hogql"], label: "HogQL" };
  if (typeof values["query"] === "string") return { code: values["query"], label: "Query" };
  return null;
}

/**
 * How a query reads in the panel. The app's `describeSource` wins field by field; without it, a
 * `file` argument is a file, SQL is SQL, and any other call shows as its request.
 */
export function originOf(name: string, query: DataSourceQuery, describe?: Describe): Origin {
  const toolName = query.toolName ?? name;
  const values = isRecord(query.args) ? query.args : {};
  const described = describe?.(toolName, query.args) ?? {};
  const text = queryText(values);
  const base = text
    ? { code: formatSql(text.code), codeLabel: text.label }
    : Object.keys(values).length
      ? { code: JSON.stringify(values, null, 2), codeLabel: "Request" }
      : { code: `${toolName}()`, codeLabel: "Call" };
  const kind = typeof values["file"] === "string" ? "File" : humanize(toolName);
  return {
    name,
    toolName,
    kind: described.kind ?? kind,
    code: described.code ?? base.code,
    codeLabel: described.codeLabel ?? base.codeLabel,
    icon: described.icon,
    query,
  };
}

/** What the panel shows for a selection: the queries it reads, and its formula. */
export interface Resolved {
  queries: string[];
  /** The prop as written, then each formula step: `value: now.revenue`, `now = @First(…)`. */
  formula: string[];
  /** Read through child components: a table's columns or a container's tiles. */
  viaChildren: boolean;
}

/**
 * The queries and formula behind a selection. A prop reads its own; a whole component reads all
 * of its props'. One that reads nothing itself but holds components (a table's columns, a
 * container's tiles) reads what those children read.
 */
export function resolve(sources: DataSources, selection: DataSourcesSelection): Resolved | null {
  const component = sources.components[selection.id];
  if (!component) return null;
  const prop = selection.prop ? component.props[selection.prop] : undefined;
  const own = prop ?? component;
  const children = prop
    ? prop.components
    : Object.values(component.props).flatMap((each) => each.components);
  let queries = own.queries;
  let via = own.via;
  let viaChildren = false;
  if (!queries.length && children.length) {
    const read = children.map((id) => sources.components[id]).filter(Boolean);
    queries = [...new Set(read.flatMap((child) => child!.queries))];
    via = [...new Set([...via, ...read.flatMap((child) => child!.via)])];
    viaChildren = queries.length > 0;
  }
  const formula = [
    ...(prop && selection.prop ? [`${selection.prop}: ${prop.expr}`] : []),
    ...via.map((name) => `${name} = ${sources.formulas[name] ?? ""}`),
  ];
  return { queries: queries.filter((name) => name in sources.queries), formula, viaChildren };
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
