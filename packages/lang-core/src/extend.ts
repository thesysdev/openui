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
import { getUnionOptions, getZodDef, schemaIdTags, tagSchemaId, unwrap } from "./signature";

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
  const changes = checkComponentChanges(base, ext.components);
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
function checkComponentChanges<C>(
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
      placements.set(path, [...(placements.get(path) ?? []), name]);
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
    fail(`${what}: "${parent}" has no content slot (a prop holding a union of components).`);
  return fail(`${what} must be one content slot. Candidates: ${candidates.join(", ")}.`);
}

/** The prop being rebuilt, its content-slot union if any, and the schemas slotted into it. */
type Slot = { path: string; union: unknown; added: z.$ZodObject[] };

// Zod parents hold their children's schema objects, not their names, so every parent of an
// overridden, removed or slotted-in component is cloned to point at the final schemas.
// Schemas with nothing to change keep their identity.
function rebuildComponents<C>(
  { byName, nameOf, removed }: ComponentChanges<C>,
  placements: Map<string, string[]>,
): Comp<C>[] {
  const done = new Map<string, Comp<C>>();

  // "Stack" -> Stack's props with every child component swapped for its final schema
  const finalProps = (name: string): z.$ZodObject => {
    const built = done.get(name);
    if (built) return built.props;
    const comp = byName.get(name)!;
    done.set(name, comp); // a component nested in itself sees its current schema
    const shape = comp.props.shape as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    let changed = false;
    for (const [prop, schema] of Object.entries(shape)) {
      const path = `${name}.${prop}`;
      const added = (placements.get(path) ?? []).map(finalProps);
      next[prop] = rebind(schema, { path, union: slotUnion(schema, nameOf), added }, new Map());
      if (next[prop] !== schema) changed = true;
    }
    if (!changed) return comp.props;
    const props = cloneSchema(comp.props, { shape: next }) as z.$ZodObject;
    tagSchemaId(props, name);
    done.set(name, { ...comp, props, ref: props as unknown as Comp<C>["ref"] });
    return props;
  };

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

    let fields = def;
    const options = getUnionOptions(schema);
    if (options?.some((o) => nameOf.has(o))) {
      // Text | Image | Frame, Frame removed and Card slotted in -> Text | Image | Card
      const kept = options.filter((o) => !removed.has(nameOf.get(o) ?? ""));
      if (!kept.length) onlyType(nameOf.get(options[0]), slot);
      const added = schema === slot.union ? slot.added.filter((a) => !kept.includes(a)) : [];
      fields = { ...def, options: [...kept, ...added] };
    }

    const patch: Record<string, unknown> = {};
    const walk = (child: unknown) => rebind(child, slot, memo);
    for (const [key, value] of Object.entries(fields)) {
      if (key === "checks") continue;
      const next = rebindField(key, value, walk);
      if (!sameField(next, def[key])) patch[key] = next;
    }
    const out = Object.keys(patch).length ? cloneSchema(schema, patch) : schema;
    memo.set(schema, out);
    return out;
  };

  for (const name of byName.keys()) finalProps(name);
  return [...byName.keys()].map((name) => done.get(name)!);
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
  const tag = schemaIdTags.get(schema);
  if (tag) schemaIdTags.set(copy, tag);
  if (isReactiveSchema(schema)) markReactive(copy);
  const meta = z.globalRegistry.get(schema);
  if (meta) z.globalRegistry.add(copy, meta);
  return copy;
}

// Media: ["Image", "Frame"] with Frame removed -> Media: ["Image"]; a group left empty goes
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
