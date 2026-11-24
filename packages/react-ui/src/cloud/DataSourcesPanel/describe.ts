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

/**
 * How a query reads in the panel. Nothing is guessed: without the app's `describeSource`, a query
 * shows its tool name and the arguments it ran with, as JSON. What the app returns (its kind,
 * icon, label and the call's text) replaces those, field by field.
 */
export function originOf(name: string, query: DataSourceQuery, describe?: Describe): Origin {
  const toolName = query.toolName ?? name;
  const described = describe?.(toolName, query.args) ?? {};
  return {
    name,
    toolName,
    kind: described.kind ?? toolName,
    code: described.code ?? JSON.stringify(query.args ?? {}, null, 2),
    codeLabel: described.codeLabel ?? toolName,
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
