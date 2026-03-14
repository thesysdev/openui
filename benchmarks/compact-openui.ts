import type { LibraryJSONSchema } from "../packages/react-lang/src/parser/parser.ts";
import type { ElementNode } from "../packages/react-lang/src/parser/types.ts";

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

interface SerializeConfig {
  propOrder: Map<string, string[]>;
  aliasByCanonical: Map<string, string>;
  hoistedRefByCanonical: Map<string, string>;
}

interface CanonStat {
  count: number;
  sample: unknown;
  size: number;
}

const HOIST_MIN_SIZE = 32;

function deriveCompactAliases(
  componentNames: string[],
  explicitAliases: Map<string, string>,
): Map<string, string> {
  const aliases = new Map<string, string>();
  const occupied = new Set(componentNames);

  const sorted = [...componentNames].sort((a, b) => b.length - a.length || a.localeCompare(b));

  // 0) Respect valid explicit aliases from schema metadata.
  for (const name of sorted) {
    const alias = explicitAliases.get(name);
    if (!alias) continue;
    const startsWithUpper = alias[0] >= "A" && alias[0] <= "Z";
    if (!startsWithUpper || alias.length >= name.length || occupied.has(alias)) continue;

    occupied.add(alias);
    aliases.set(name, alias);
  }

  const acronymByName = new Map<string, string>();
  const acronymCount = new Map<string, number>();
  for (const name of componentNames) {
    const words = name.match(/[A-Z][a-z0-9]*/g) ?? [name];
    const acronym = words.map((w) => w[0]).join("");
    acronymByName.set(name, acronym);
    acronymCount.set(acronym, (acronymCount.get(acronym) ?? 0) + 1);
  }

  // 1) Unique acronyms.
  for (const name of sorted) {
    if (aliases.has(name)) continue;

    const acronym = acronymByName.get(name)!;
    const startsWithUpper = acronym[0] >= "A" && acronym[0] <= "Z";
    if (!startsWithUpper || acronym.length >= name.length) continue;
    if ((acronymCount.get(acronym) ?? 0) !== 1) continue;
    if (occupied.has(acronym)) continue;

    occupied.add(acronym);
    aliases.set(name, acronym);
  }

  // 2) Shortest unique prefix fallback.
  for (const name of sorted) {
    if (aliases.has(name)) continue;

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

  const explicitAliases = new Map<string, string>();
  for (const [name, def] of Object.entries(defs)) {
    propOrder.set(name, Object.keys(def.properties ?? {}));

    const alias = (def as any)["x-openui-alias"];
    if (typeof alias === "string" && alias.trim()) {
      explicitAliases.set(name, alias.trim());
    }
  }

  return {
    propOrder,
    aliasByCanonical: deriveCompactAliases(Object.keys(defs), explicitAliases),
    hoistedRefByCanonical: new Map(),
  };
}

function isElementNode(value: unknown): value is ElementNode {
  return !!value && typeof value === "object" && (value as ElementNode).type === "element";
}

function isHoistable(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return true;
  if (isElementNode(value)) return true;
  return typeof value === "object";
}

function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (isElementNode(value)) {
    const entries = Object.entries(value.props ?? {}).map(([k, v]) => `${k}:${canonicalize(v)}`);
    return `@${value.typeName}(${entries.join(",")})`;
  }
  if (typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`)
      .join(",")}}`;
  }
  return "null";
}

function collectHoistStats(value: unknown, stats: Map<string, CanonStat>): void {
  if (!isHoistable(value)) return;

  const canon = canonicalize(value);
  const prev = stats.get(canon);
  if (prev) {
    prev.count += 1;
  } else {
    stats.set(canon, { count: 1, sample: value, size: canon.length });
  }

  if (Array.isArray(value)) {
    for (const item of value) collectHoistStats(item, stats);
    return;
  }

  if (isElementNode(value)) {
    for (const propValue of Object.values(value.props ?? {})) collectHoistStats(propValue, stats);
    return;
  }

  for (const v of Object.values(value as Record<string, unknown>)) collectHoistStats(v, stats);
}

function* refNames(): Generator<string> {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let index = 0;
  while (true) {
    let n = index;
    let out = "";
    do {
      out = chars[n % 26] + out;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    index++;
    yield out;
  }
}

function selectHoists(root: ElementNode): { canonical: string; ref: string; sample: unknown }[] {
  const stats = new Map<string, CanonStat>();
  collectHoistStats(root, stats);

  const candidates = [...stats.entries()]
    .filter(([, s]) => s.count > 1 && s.size >= HOIST_MIN_SIZE)
    .map(([canonical, s]) => ({ canonical, sample: s.sample, score: s.count * s.size, size: s.size }))
    .sort((a, b) => b.score - a.score || b.size - a.size || a.canonical.localeCompare(b.canonical));

  const refs = refNames();
  return candidates.map(c => ({ canonical: c.canonical, ref: refs.next().value!, sample: c.sample }));
}

function serializeObject(
  value: { [k: string]: JsonValue },
  cfg: SerializeConfig,
  hoistsEnabled: boolean,
): string {
  return `{${Object.entries(value)
    .map(([k, v]) => `${JSON.stringify(k)}:${serializeValue(v, cfg, hoistsEnabled)}`)
    .join(",")}}`;
}

function serializeElement(node: ElementNode, cfg: SerializeConfig, hoistsEnabled: boolean): string {
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
      args.push(serializeValue(props[key], cfg, hoistsEnabled));
    } else {
      // Keep positional alignment for later arguments.
      args.push("null");
    }
  }

  return `${emittedType}(${args.join(",")})`;
}

function serializeValue(value: unknown, cfg: SerializeConfig, hoistsEnabled: boolean): string {
  if (hoistsEnabled && isHoistable(value)) {
    const ref = cfg.hoistedRefByCanonical.get(canonicalize(value));
    if (ref) return ref;
  }

  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return `[${value.map(v => serializeValue(v, cfg, hoistsEnabled)).join(",")}]`;
  if (isElementNode(value)) return serializeElement(value, cfg, hoistsEnabled);
  if (typeof value === "object")
    return serializeObject(value as { [k: string]: JsonValue }, cfg, hoistsEnabled);
  return "null";
}

export function toCompactOpenUI(root: ElementNode, schema: LibraryJSONSchema): string {
  const cfg = createSerializeConfig(schema);
  const hoists = selectHoists(root);
  for (const h of hoists) cfg.hoistedRefByCanonical.set(h.canonical, h.ref);

  const lines: string[] = [];
  lines.push(`root=${serializeElement(root, cfg, true)}`);

  // Definitions are emitted without hoist replacement to avoid accidental self-reference cycles.
  for (const h of hoists) {
    lines.push(`${h.ref}=${serializeValue(h.sample, cfg, false)}`);
  }

  return `${lines.join("\n")}\n`;
}
