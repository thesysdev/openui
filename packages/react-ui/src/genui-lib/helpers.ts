type ElementLike = {
  type: "element";
  props: Record<string, unknown>;
};

const DISPLAY_TEXT_KEYS = ["title", "text", "label", "value"] as const;

export interface DisplayTextCoercionResult {
  text: string;
  coerced: boolean;
  sourceType: string;
  fallbackKey?: (typeof DISPLAY_TEXT_KEYS)[number];
}

function valueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function stringifyObject(value: object): string {
  try {
    return JSON.stringify(value) ?? "";
  } catch {
    return "";
  }
}

export function coerceDisplayText(value: unknown): DisplayTextCoercionResult {
  if (value == null) {
    return { text: "", coerced: false, sourceType: valueType(value) };
  }

  if (typeof value === "string") {
    return { text: value, coerced: false, sourceType: "string" };
  }

  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return { text: String(value), coerced: true, sourceType: valueType(value) };
  }

  if (Array.isArray(value)) {
    const parts = value.map((item) => coerceDisplayText(item).text).filter(Boolean);
    return { text: parts.join(", "), coerced: true, sourceType: "array" };
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of DISPLAY_TEXT_KEYS) {
      if (!(key in obj)) continue;
      const result = coerceDisplayText(obj[key]);
      if (result.text) {
        return { text: result.text, coerced: true, sourceType: "object", fallbackKey: key };
      }
    }
    return { text: stringifyObject(value), coerced: true, sourceType: "object" };
  }

  return { text: "", coerced: true, sourceType: valueType(value) };
}

export function displayText(value: unknown): string {
  return coerceDisplayText(value).text;
}

export function optionalDisplayText(value: unknown): string | undefined {
  const text = displayText(value);
  return text ? text : undefined;
}

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

export function buildChartData(
  labels: unknown,
  series: unknown,
): Record<string, string | number>[] {
  const lbls = asArray(labels) as string[];

  // Tabular format: labels = column names, series = 2D rows from Query results
  // e.g. AreaChart(data.columns, data.results) where columns=["day","views","users"]
  // and results=[["Mon",100,50],["Tue",200,75]]
  const rows = asArray(series);
  if (rows.length > 0 && Array.isArray(rows[0])) {
    // Column 0 = category labels, columns 1+ = series values
    const seriesNames = lbls.slice(1);
    return rows.map((row) => {
      const cells = row as unknown[];
      const point: Record<string, string | number> = { category: String(cells[0] ?? "") };
      seriesNames.forEach((name, si) => {
        const val = cells[si + 1];
        point[name] = typeof val === "number" ? val : Number(val) || 0;
      });
      return point;
    });
  }

  // Original format: labels = x-axis values, series = Series() elements
  const seriesNodes = asElementNodes(series);
  return lbls.map((label, i) => {
    const point: Record<string, string | number> = { category: label };
    seriesNodes.forEach((s) => {
      const cat = s.props["category"];
      const vals = s.props["values"];
      if (typeof cat === "string" && Array.isArray(vals) && i < vals.length) {
        point[cat] = vals[i]!;
      }
    });
    return point;
  });
}

export function buildSliceData(slices: unknown): Record<string, string | number>[] {
  return asElementNodes(slices).map((s) => ({
    category: s.props["category"] as string,
    value: s.props["value"] as number,
  }));
}
