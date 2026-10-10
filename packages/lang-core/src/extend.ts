// library.extend: derives a library definition from a base plus additions, overrides and removals.
import * as z from "zod/v4/core";
import type {
  AnyAction,
  ComponentGroup,
  DefinedComponent,
  Library,
  LibraryDefinition,
  LibraryExtension,
  PromptOptions,
} from "./library";
import { isReactiveSchema, markReactive } from "./reactive";
import { copySchemaTags, getUnionOptions, getZodDef, unwrap } from "./signature";

// ─── library.extend ─────────────────────────────────────────────────────────

type Comp<C> = DefinedComponent<any, C>;

const fail = (message: string): never => {
  throw new Error(`[extend] ${message}`);
};

// add ProductCard into "Card", remove Frame -> the base parts with Card, every parent and the groups updated
export function extendDefinition<C>(
  base: LibraryDefinition<C, AnyAction>,
  ext: LibraryExtension<C, AnyAction>,
): { definition: LibraryDefinition<C, AnyAction>; removed: string[] } {
  const changes = applyComponentVerbs(base, ext.components);
  const slots = findContentSlots(changes);
  const placements = placeInSlots(changes, slots);
  return {
    definition: {
      ...base,
      id: undefined, // a derived library does not inherit the base's public id
      components: rebuildComponents(changes, placements),
      componentGroups: withoutRemoved(base.componentGroups, changes.removed),
      functions: [...(base.functions ?? []), ...(ext.functions?.add ?? [])],
      actions: [...(base.actions ?? []), ...(ext.actions?.add ?? [])],
    },
    removed: [...changes.removed],
  };
}

interface ComponentChanges<C> {
  /** The library's components after the verbs, in order. */
  byName: Map<string, Comp<C>>;
  /** Every schema that stands for a component, old, new or removed, mapped to its name. */
  nameOf: Map<unknown, string>;
  /** "ProductCard" -> ["Card"] */
  slotRequests: Map<string, string[]>;
  removed: Set<string>;
}

// add [Card], override [Image], remove ["Frame"] -> Stack, Text, Image (new), Card
function applyComponentVerbs<C>(
  base: LibraryDefinition<C, AnyAction>,
  verbs: LibraryExtension<C, AnyAction>["components"] = {},
): ComponentChanges<C> {
  const byName = new Map(base.components.map((c) => [c.name, c]));
  const nameOf = new Map<unknown, string>(base.components.map((c) => [c.props, c.name]));
  const slotRequests = new Map<string, string[]>();
  const touched = new Set<string>(); // added or overridden in this call
  const put = (comp: Comp<C>) => {
    byName.set(comp.name, comp);
    nameOf.set(comp.props, comp.name);
    touched.add(comp.name);
  };

  for (const entry of verbs.add ?? []) {
    const { component, slots } = "slots" in entry ? entry : { component: entry, slots: undefined };
    const name = component.name;
    if (byName.has(name)) fail(`Component "${name}" already exists. Use override.`);
    if (slots?.length === 0) fail(`"slots" for "${name}" is empty. Omit it to only list it.`);
    put(component);
    if (slots) slotRequests.set(name, slots);
  }
  const overridden = new Set<string>();
  for (const comp of verbs.override ?? []) {
    if (!byName.has(comp.name))
      fail(`Cannot override "${comp.name}": not in the library. Use add.`);
    if (overridden.has(comp.name)) fail(`Component "${comp.name}" is overridden twice.`);
    overridden.add(comp.name);
    put(comp);
  }
  const removed = new Set(verbs.remove);
  for (const name of removed) {
    if (touched.has(name))
      fail(`Cannot remove "${name}": it is added or overridden in the same call.`);
    if (!byName.delete(name)) fail(`Cannot remove "${name}": not in the library.`);
    if (name === base.root) fail(`Cannot remove "${name}": it is the library root.`);
  }
  return { byName, nameOf, slotRequests, removed };
}

// A content slot holds a union of components, maybe optional or in an array:
// children: z.array(z.union([Text.ref, Image.ref])) -> that union
function slotUnion(schema: unknown, nameOf: Map<unknown, string>): unknown {
  const inner = unwrap(schema);
  const def = getZodDef(inner);
  if (def?.type === "array") return slotUnion(def.element, nameOf);
  return getUnionOptions(inner)?.some((o) => nameOf.has(o)) ? inner : undefined;
}

// Stack(children: (Text | Image)[]) -> ["Stack.children"]
function findContentSlots<C>({ byName, nameOf }: ComponentChanges<C>): string[] {
  const slots: string[] = [];
  for (const comp of byName.values()) {
    for (const [prop, schema] of Object.entries(comp.props.shape)) {
      if (slotUnion(schema, nameOf)) slots.push(`${comp.name}.${prop}`);
    }
  }
  return slots;
}

// ProductCard asks for ["Card"] -> "Card.children" -> ["ProductCard"]
function placeInSlots<C>(changes: ComponentChanges<C>, slots: string[]): Map<string, string[]> {
  const placements = new Map<string, string[]>();
  for (const [name, requested] of changes.slotRequests) {
    for (const slot of requested) {
      const path = resolveSlot(slot, name, slots, changes.byName);
      const placed = placements.get(path) ?? [];
      // slots: ["Stack.children", "Stack"] name one path; Card joins it once
      if (!placed.includes(name)) placements.set(path, [...placed, name]);
    }
  }
  return placements;
}

// "Stack.children" stays; "Stack" -> "Stack.children" when Stack has exactly one content slot
function resolveSlot(slot: string, name: string, slots: string[], byName: Map<string, unknown>) {
  if (slots.includes(slot)) return slot;
  const parent = slot.split(".")[0]!;
  const candidates = slots.filter((s) => s.startsWith(`${parent}.`));
  if (!slot.includes(".") && candidates.length === 1) return candidates[0]!;
  const what = `Slot "${slot}" for "${name}"`;
  if (!byName.has(parent)) fail(`${what}: "${parent}" is not in the library.`);
  if (!candidates.length)
    fail(
      `${what}: "${parent}" has no content slot (a prop that is a union of components, or an optional or array of one).`,
    );
  return fail(`${what} must be one content slot. Candidates: ${candidates.join(", ")}.`);
}

/** The prop being rebuilt, its content-slot union if any, and the schemas slotted into it. */
type Slot = { path: string; union: unknown; added: unknown[] };

// Zod parents hold their children's schema objects, not their names, so every parent of an
// overridden, removed or slotted-in component is cloned to point at the final schemas.
// Schemas with nothing to change keep their identity. Built in two passes so cycles work:
// every clone exists (with an empty shape) before any shape is filled, so Card(body: Stack)
// slotted into Stack.children points at the new Stack, and the new Stack at the new Card.
function rebuildComponents<C>(
  changes: ComponentChanges<C>,
  placements: Map<string, string[]>,
): Comp<C>[] {
  const { byName, nameOf, removed } = changes;
  const final = new Map<string, Comp<C>>(byName);
  const shapes = new Map<string, Record<string, unknown>>();
  for (const name of findRebuilt(changes, placements)) {
    const comp = byName.get(name)!;
    const shape: Record<string, unknown> = {};
    const props = cloneSchema(comp.props, {
      get shape() {
        return shape; // filled below, read by zod only after
      },
    }) as z.$ZodObject;
    final.set(name, { ...comp, props, ref: props as unknown as Comp<C>["ref"] });
    shapes.set(name, shape);
  }
  const finalProps = (name: string) => final.get(name)!.props;

  const onlyType = (name: string | undefined, slot: Slot): never =>
    fail(`Cannot remove "${name}": it is the only type allowed in ${slot.path}.`);

  // z.array(z.union([Text, Frame])) with Frame removed -> z.array(z.union([Text]))
  const rebind = (schema: unknown, slot: Slot, memo: Map<unknown, unknown>): unknown => {
    const name = nameOf.get(schema);
    if (name !== undefined) {
      if (removed.has(name)) onlyType(name, slot);
      return finalProps(name);
    }
    const def = getZodDef(schema);
    if (!def || def.type === "lazy") return schema;
    if (memo.has(schema)) return memo.get(schema);
    memo.set(schema, schema); // cycle guard
    const walk = (child: unknown) => rebind(child, slot, memo);

    const patch: Record<string, unknown> = {};
    const options = getUnionOptions(schema);
    const holdsComponents = options?.some((o) => nameOf.has(o));
    for (const [key, value] of Object.entries(def)) {
      if (key === "checks" || (holdsComponents && key === "options")) continue;
      const next = rebindField(key, value, walk);
      if (!sameField(next, value)) patch[key] = next;
    }
    if (holdsComponents) {
      // Text | Image | Frame, Frame removed and Card slotted in -> Text | Image | Card
      const kept = options!.filter((o) => !removed.has(nameOf.get(o) ?? "")).map(walk);
      const added = schema === slot.union ? slot.added.filter((a) => !kept.includes(a)) : [];
      if (!kept.length && !added.length) onlyType(nameOf.get(options![0]), slot);
      const next = [...kept, ...added];
      if (!sameField(next, options)) patch.options = next;
    }
    const out = Object.keys(patch).length ? cloneSchema(schema, patch) : schema;
    memo.set(schema, out);
    return out;
  };

  for (const [name, shape] of shapes) {
    for (const [prop, schema] of Object.entries(byName.get(name)!.props.shape)) {
      const path = `${name}.${prop}`;
      const added = (placements.get(path) ?? []).map(finalProps);
      shape[prop] = rebind(schema, { path, union: slotUnion(schema, nameOf), added }, new Map());
    }
  }
  return [...final.values()];
}

// Stack gets a slotted-in Card, Frame nests a removed or overridden Image, or a component nests
// one of those (repeated until nothing changes, so cycles settle) -> those names
function findRebuilt<C>(
  { byName, nameOf, removed }: ComponentChanges<C>,
  placements: Map<string, string[]>,
): Set<string> {
  const nested = new Map<string, Set<unknown>>();
  for (const [name, comp] of byName) {
    const found = new Set<unknown>();
    for (const schema of Object.values(comp.props.shape)) nestedComponents(schema, nameOf, found);
    nested.set(name, found);
  }
  const stale = (s: unknown) => {
    const name = nameOf.get(s)!;
    return removed.has(name) || byName.get(name)!.props !== s;
  };
  const slotted = new Set([...placements.keys()].map((path) => path.split(".")[0]!));
  const rebuilt = new Set([...byName.keys()].filter((n) => slotted.has(n)));
  for (const [name, found] of nested) if ([...found].some(stale)) rebuilt.add(name);
  for (let grew = true; grew;) {
    grew = false;
    for (const [name, found] of nested) {
      if (rebuilt.has(name) || ![...found].some((s) => rebuilt.has(nameOf.get(s)!))) continue;
      rebuilt.add(name);
      grew = true;
    }
  }
  return rebuilt;
}

// Card(body: Stack, tags?: (Text | Image)[]) -> Stack, Text, Image; stops at each component
function nestedComponents(
  schema: unknown,
  nameOf: Map<unknown, string>,
  found: Set<unknown>,
  seen = new Set<unknown>(),
): void {
  if (nameOf.has(schema)) return void found.add(schema);
  const def = getZodDef(schema);
  if (!def || def.type === "lazy" || seen.has(schema)) return;
  seen.add(schema);
  for (const [key, value] of Object.entries(def)) {
    if (key === "checks") continue;
    rebindField(key, value, (child) => nestedComponents(child, nameOf, found, seen));
  }
}

// A def field holds a schema, an array of schemas, a shape of schemas, or plain data
function rebindField(key: string, value: unknown, walk: (s: unknown) => unknown): unknown {
  if (getZodDef(value)) return walk(value);
  if (Array.isArray(value)) return value.map(walk);
  if (key !== "shape") return value;
  const shape: Record<string, unknown> = {};
  for (const [prop, child] of Object.entries(value as object)) shape[prop] = walk(child);
  return shape;
}

// Arrays and shapes are rebuilt on every walk, so compare their entries, not their identity
function sameField(next: unknown, old: any): boolean {
  if (next === old) return true;
  if (getZodDef(next)) return false;
  const entries = Object.entries(next as object);
  return entries.length === Object.keys(old).length && entries.every(([i, c]) => c === old[i]);
}

// Copy a schema with a patched def, keeping its prompt tags and metadata.
function cloneSchema(s: unknown, patch: Record<string, unknown>): unknown {
  const schema = s as z.$ZodType;
  const copy = z.clone(schema, z.util.mergeDefs(schema._zod.def, patch) as any);
  copySchemaTags(schema, copy);
  if (isReactiveSchema(schema)) markReactive(copy);
  const meta = z.globalRegistry.get(schema);
  if (meta) z.globalRegistry.add(copy, meta);
  return copy;
}

// Media: ["Image", "Frame"] with Frame removed -> Media: ["Image"]; a group left empty is dropped
function withoutRemoved(groups: ComponentGroup[] | undefined, removed: Set<string>) {
  return groups
    ?.map((g) => ({ ...g, components: g.components.filter((n) => !removed.has(n)) }))
    .filter((g) => g.components.length);
}

/** Removed component names a library's prompt notes, examples or rules may still name. */
const staleNames = new WeakMap<object, string[]>();

// remove: ["Frame"] while a group note says "Frame wraps one Image" -> one console.warn.
// Notes are checked now, examples and rules on each prompt(); each name warns once,
// and names removed earlier in a chain of extends carry over until re-added or warned.
export function warnOnStaleNames<L extends Required<Library<any, any>>>(
  base: object,
  derived: L,
  newlyRemoved: string[],
): L {
  let stale = [...new Set([...(staleNames.get(base) ?? []), ...newlyRemoved])].filter(
    (n) => !(n in derived.components),
  );
  if (!stale.length) return derived;
  const warnIfNamed = (texts: string[]) => {
    const named = stale.filter((n) => texts.some((t) => new RegExp(`\\b${n}\\b`).test(t)));
    if (!named.length) return;
    stale = stale.filter((n) => !named.includes(n));
    staleNames.set(derived, stale);
    console.warn(
      `[extend] Removed ${named.join(", ")} still named in prompt notes, examples or rules.`,
    );
  };
  staleNames.set(derived, stale);
  warnIfNamed(derived.componentGroups?.flatMap((g) => g.notes ?? []) ?? []);
  const { prompt } = derived;
  return Object.assign(derived, {
    prompt(options?: PromptOptions) {
      const { examples = [], toolExamples = [], additionalRules = [] } = options ?? {};
      warnIfNamed([...examples, ...toolExamples, ...additionalRules]);
      return prompt(options);
    },
  });
}
