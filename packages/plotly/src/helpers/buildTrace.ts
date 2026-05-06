// Helpers shared by Tier-1 typed components. They accept either Plotly Express
// style (`data` is an array of objects + `x`/`y` are field names) or
// Graph-Objects style (`data` is null/undefined and `x`/`y` are raw arrays).

export type Row = Record<string, unknown>;
export type ArrayLike = readonly (string | number | null | undefined)[];

export function isStringField(v: unknown): v is string {
  return typeof v === "string";
}

export function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

export function pluck<T = unknown>(rows: Row[], field: string): T[] {
  return rows.map((r) => r[field] as T);
}

export interface Resolved {
  x: ArrayLike;
  y: ArrayLike;
  /** Categorical series — present when `color` resolves to a string column. */
  group?: string[];
  /** Continuous color values — present when `color` resolves to a numeric column. */
  color?: number[];
}

export interface ResolveInput {
  data?: Row[] | null;
  x?: ArrayLike | string;
  y?: ArrayLike | string;
  color?: ArrayLike | string;
}

/**
 * Normalize the (data, x, y, color) input pattern into resolved arrays.
 *
 * Express style: `data` is row-objects, `x`/`y`/`color` are field names.
 * Graph-Objects style: `data` is null, `x`/`y`/`color` are arrays.
 *
 * `color` is treated as continuous if every value is numeric, categorical otherwise.
 */
export function resolve({ data, x, y, color }: ResolveInput): Resolved | null {
  const fromRows = (rows: Row[]): Resolved | null => {
    if (!isStringField(x) || !isStringField(y)) return null;
    const xs = pluck(rows, x) as ArrayLike;
    const ys = pluck(rows, y) as ArrayLike;
    if (!color) return { x: xs, y: ys };
    if (!isStringField(color)) return null;
    const cs = pluck<unknown>(rows, color);
    if (cs.every((v) => typeof v === "number")) {
      return { x: xs, y: ys, color: cs as number[] };
    }
    return { x: xs, y: ys, group: cs.map(String) };
  };

  if (data && Array.isArray(data) && data.length > 0) {
    return fromRows(data);
  }

  // Graph-Objects style: x / y are raw arrays.
  if (isArray(x) && isArray(y)) {
    const out: Resolved = { x: x as ArrayLike, y: y as ArrayLike };
    if (isArray(color)) {
      const cs = color as unknown[];
      if (cs.every((v) => typeof v === "number")) out.color = cs as number[];
      else out.group = cs.map(String);
    }
    return out;
  }

  return null;
}

/**
 * Split a resolved Resolved into per-group sub-arrays so we can produce
 * one Plotly trace per categorical color level.
 */
export function splitByGroup(r: Resolved): Array<{ group: string; x: ArrayLike; y: ArrayLike }> {
  if (!r.group) return [{ group: "", x: r.x, y: r.y }];
  const groups = new Map<string, { x: unknown[]; y: unknown[] }>();
  const groupArr = r.group;
  for (let i = 0; i < r.x.length; i++) {
    const g = groupArr[i];
    if (g === undefined) continue;
    if (!groups.has(g)) groups.set(g, { x: [], y: [] });
    const bucket = groups.get(g)!;
    bucket.x.push(r.x[i]);
    bucket.y.push(r.y[i]);
  }
  return Array.from(groups.entries()).map(([group, { x, y }]) => ({
    group,
    x: x as ArrayLike,
    y: y as ArrayLike,
  }));
}

/**
 * Build a layout title from the chart's title/xLabel/yLabel props with
 * Plotly's expected shape (string is title text).
 */
export function buildAxisLayout(opts: {
  title?: string;
  xLabel?: string;
  yLabel?: string;
}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (opts.title) out["title"] = { text: opts.title };
  if (opts.xLabel) out["xaxis"] = { title: { text: opts.xLabel } };
  if (opts.yLabel) out["yaxis"] = { title: { text: opts.yLabel } };
  return out;
}
