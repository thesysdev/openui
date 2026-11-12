/* ---------- Helpers ---------- */

export function toNumbers(values: unknown): (number | null)[] {
  if (!Array.isArray(values)) return [];
  return values.map((value) =>
    typeof value === "number" && Number.isFinite(value) ? value : null,
  );
}

export function toStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((value) => (value === null || value === undefined ? "" : String(value)));
}

/** Props of a child component node (e.g. a Series inside a chart). */
export function nodeProps<T>(node: unknown): T | null {
  if (!node || typeof node !== "object") return null;
  const props = (node as { props?: unknown }).props;
  return props && typeof props === "object" ? (props as T) : null;
}

export function nodeList<T>(nodes: unknown): T[] {
  if (!Array.isArray(nodes)) return [];
  return nodes.map((node) => nodeProps<T>(node)).filter((props): props is T => props !== null);
}

/**
 * Arranges one-entry-per-cell arrays (each cell's row label, column label and value, the way
 * query rows give them) into a grid. Rows and columns keep the order they first appear in; a
 * cell no entry names is null.
 */
export function toGrid<T>(rowLabels: unknown, columnLabels: unknown, values: unknown) {
  const rowOf = toStrings(rowLabels);
  const columnOf = toStrings(columnLabels);
  const list: unknown[] = Array.isArray(values) ? values : [];
  const rows = [...new Set(rowOf)];
  const columns = [...new Set(columnOf)];
  const cells = rows.map(() => columns.map((): T | null => null));
  for (let i = 0; i < Math.min(rowOf.length, columnOf.length); i++)
    cells[rows.indexOf(rowOf[i]!)]![columns.indexOf(columnOf[i]!)] = (list[i] as T) ?? null;
  return { rows, columns, cells };
}
