/**
 * Shared helpers for turning OpenUI Lang element nodes (Series, Slice, …) into
 * the plain data shapes that `@mui/x-charts` expects.
 */

type ElementLike = {
  type: "element";
  props: Record<string, unknown>;
};

export function hasAllProps(obj: Record<string, unknown>, ...keys: string[]): boolean {
  return keys.every((k) => obj[k] != null);
}

export function asArray(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return [v];
}

function asElementNodes(v: unknown): ElementLike[] {
  return asArray(v).filter(
    (x): x is ElementLike =>
      typeof x === "object" && x !== null && (x as Record<string, unknown>)["type"] === "element",
  );
}

function toNumber(v: unknown): number {
  return typeof v === "number" ? v : Number(v) || 0;
}

export interface CartesianSeries {
  label: string;
  data: number[];
}

/** Convert an array of `Series(category, values)` nodes into x-charts series. */
export function buildSeries(series: unknown): CartesianSeries[] {
  return asElementNodes(series).map((s) => ({
    label: String(s.props["category"] ?? ""),
    data: asArray(s.props["values"]).map(toNumber),
  }));
}

export interface PieDatum {
  id: number;
  value: number;
  label: string;
}

/** Convert an array of `Slice(category, value)` nodes into x-charts pie data. */
export function buildPie(slices: unknown): PieDatum[] {
  return asElementNodes(slices).map((s, i) => ({
    id: i,
    value: toNumber(s.props["value"]),
    label: String(s.props["category"] ?? ""),
  }));
}
