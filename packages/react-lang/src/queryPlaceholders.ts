import { isASTNode, walkAST, type ElementNode } from "@openuidev/lang-core";

function isElement(value: unknown): value is ElementNode {
  return !!value && typeof value === "object" && "type" in value && value.type === "element";
}

/** Find unresolved query reads on a widget, without marking its layout ancestors. */
function readsPendingQuery(value: unknown, pending: Set<string>): boolean {
  if (!value || typeof value !== "object" || isElement(value)) return false;
  if (isASTNode(value)) {
    let found = false;
    walkAST(value, (node) => {
      if (node.k === "RuntimeRef" && node.refType === "query" && pending.has(node.n)) found = true;
    });
    return found;
  }
  if (Array.isArray(value)) return value.some((item) => readsPendingQuery(item, pending));
  // Action expressions are evaluated on interaction, not while displaying data.
  if ("steps" in value || "valueAST" in value) return false;
  return Object.values(value).some((item) => readsPendingQuery(item, pending));
}

/** Associate evaluated widgets with placeholders while preserving static layout and labels. */
export function queryPlaceholders(
  source: ElementNode,
  evaluated: ElementNode,
  pending: Set<string>,
): WeakMap<ElementNode, string | undefined> {
  const placeholders = new WeakMap<ElementNode, string | undefined>();
  function visit(raw: unknown, resolved: unknown) {
    if (isElement(raw) && isElement(resolved)) {
      if (Object.values(raw.props).some((value) => readsPendingQuery(value, pending))) {
        const label = raw.props.title ?? raw.props.top;
        placeholders.set(resolved, typeof label === "string" ? label : undefined);
      }
      visit(raw.props, resolved.props);
    } else if (Array.isArray(raw) && Array.isArray(resolved)) {
      raw.forEach((value, index) => visit(value, resolved[index]));
    } else if (raw && resolved && typeof raw === "object" && typeof resolved === "object") {
      for (const [key, value] of Object.entries(raw)) {
        visit(value, (resolved as Record<string, unknown>)[key]);
      }
    }
  }
  visit(source, evaluated);
  return placeholders;
}
