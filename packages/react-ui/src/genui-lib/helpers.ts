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

// "1. ", "2) ", "#3 " or "Step 4: " at the start of a title. A bare
// "2024: " is left alone, since a Timeline title can lead with its year.
const OWN_NUMBER = /^\s*(?:step\s+\d+\s*[.):]?|\d+\s*[.)]|#\d+)\s+/i;

/**
 * Drops a number the model typed at the start of a title ("1. Collect")
 * when the component numbers its rows itself, so the row doesn't read
 * "① 1. Collect". Handles a plain string, a Text-like node with a `text`
 * prop, and the first piece of an array.
 */
export function withoutOwnNumber(title: unknown): unknown {
  if (typeof title === "string") return title.replace(OWN_NUMBER, "");
  if (Array.isArray(title)) {
    return title.length ? [withoutOwnNumber(title[0]), ...title.slice(1)] : title;
  }
  const [node] = asElementNodes(title);
  if (node && typeof node.props["text"] === "string") {
    return { ...node, props: { ...node.props, text: node.props["text"].replace(OWN_NUMBER, "") } };
  }
  return title;
}
