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
