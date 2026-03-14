import type { LibraryJSONSchema } from "../packages/react-lang/src/parser/parser.ts";
import type { ElementNode } from "../packages/react-lang/src/parser/types.ts";

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

function compilePropOrder(schema: LibraryJSONSchema): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const defs = schema.$defs ?? {};
  for (const [name, def] of Object.entries(defs)) {
    map.set(name, Object.keys(def.properties ?? {}));
  }
  return map;
}

function isElementNode(value: unknown): value is ElementNode {
  return !!value && typeof value === "object" && (value as ElementNode).type === "element";
}

function serializeObject(value: { [k: string]: JsonValue }): string {
  return `{${Object.entries(value)
    .map(([k, v]) => `${JSON.stringify(k)}:${serializeValue(v)}`)
    .join(",")}}`;
}

function serializeValue(value: unknown, propOrder: Map<string, string[]>): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return `[${value.map(v => serializeValue(v, propOrder)).join(",")}]`;
  if (isElementNode(value)) return serializeElement(value, propOrder);
  if (typeof value === "object") return serializeObject(value as { [k: string]: JsonValue });
  return "null";
}

function serializeElement(node: ElementNode, propOrder: Map<string, string[]>): string {
  const props = node.props ?? {};
  const order = propOrder.get(node.typeName) ?? Object.keys(props);

  let lastPresentIndex = -1;
  for (let i = 0; i < order.length; i++) {
    if (Object.prototype.hasOwnProperty.call(props, order[i])) {
      lastPresentIndex = i;
    }
  }

  if (lastPresentIndex < 0) return `${node.typeName}()`;

  const args: string[] = [];
  for (let i = 0; i <= lastPresentIndex; i++) {
    const key = order[i];
    if (Object.prototype.hasOwnProperty.call(props, key)) {
      args.push(serializeValue(props[key], propOrder));
    } else {
      // Keep positional alignment for later arguments.
      args.push("null");
    }
  }

  return `${node.typeName}(${args.join(",")})`;
}

export function toCompactOpenUI(root: ElementNode, schema: LibraryJSONSchema): string {
  const propOrder = compilePropOrder(schema);
  return `root=${serializeElement(root, propOrder)}\n`;
}
