import type { LibraryJSONSchema } from "../packages/react-lang/src/parser/parser.ts";
import type { ElementNode } from "../packages/react-lang/src/parser/types.ts";

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

interface SerializeConfig {
  propOrder: Map<string, string[]>;
  aliasByCanonical: Map<string, string>;
}

function deriveCompactAliases(componentNames: string[]): Map<string, string> {
  const aliases = new Map<string, string>();
  const occupied = new Set(componentNames);

  const sorted = [...componentNames].sort((a, b) => a.length - b.length || a.localeCompare(b));

  for (const name of sorted) {
    for (let len = 1; len < name.length; len++) {
      const alias = name.slice(0, len);
      const startsWithUpper = alias[0] >= "A" && alias[0] <= "Z";
      if (!startsWithUpper || occupied.has(alias)) continue;

      occupied.add(alias);
      aliases.set(name, alias);
      break;
    }
  }

  return aliases;
}

function createSerializeConfig(schema: LibraryJSONSchema): SerializeConfig {
  const propOrder = new Map<string, string[]>();
  const defs = schema.$defs ?? {};
  for (const [name, def] of Object.entries(defs)) {
    propOrder.set(name, Object.keys(def.properties ?? {}));
  }

  return {
    propOrder,
    aliasByCanonical: deriveCompactAliases(Object.keys(defs)),
  };
}

function isElementNode(value: unknown): value is ElementNode {
  return !!value && typeof value === "object" && (value as ElementNode).type === "element";
}

function serializeObject(value: { [k: string]: JsonValue }, cfg: SerializeConfig): string {
  return `{${Object.entries(value)
    .map(([k, v]) => `${JSON.stringify(k)}:${serializeValue(v, cfg)}`)
    .join(",")}}`;
}

function serializeValue(value: unknown, cfg: SerializeConfig): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return `[${value.map(v => serializeValue(v, cfg)).join(",")}]`;
  if (isElementNode(value)) return serializeElement(value, cfg);
  if (typeof value === "object") return serializeObject(value as { [k: string]: JsonValue }, cfg);
  return "null";
}

function serializeElement(node: ElementNode, cfg: SerializeConfig): string {
  const props = node.props ?? {};
  const order = cfg.propOrder.get(node.typeName) ?? Object.keys(props);

  let lastPresentIndex = -1;
  for (let i = 0; i < order.length; i++) {
    if (Object.prototype.hasOwnProperty.call(props, order[i])) {
      lastPresentIndex = i;
    }
  }

  const emittedType = cfg.aliasByCanonical.get(node.typeName) ?? node.typeName;
  if (lastPresentIndex < 0) return `${emittedType}()`;

  const args: string[] = [];
  for (let i = 0; i <= lastPresentIndex; i++) {
    const key = order[i];
    if (Object.prototype.hasOwnProperty.call(props, key)) {
      args.push(serializeValue(props[key], cfg));
    } else {
      // Keep positional alignment for later arguments.
      args.push("null");
    }
  }

  return `${emittedType}(${args.join(",")})`;
}

export function toCompactOpenUI(root: ElementNode, schema: LibraryJSONSchema): string {
  const cfg = createSerializeConfig(schema);
  return `root=${serializeElement(root, cfg)}\n`;
}
