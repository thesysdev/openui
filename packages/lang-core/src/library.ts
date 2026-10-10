import { object as zObject } from "zod/v4";
import * as z from "zod/v4/core";
import type { DefinedAction, DefinedFunction } from "./functions";
import { ACTION_DEFS, isBuiltin, isReservedCall } from "./parser/builtins";
import type { ComponentPromptSpec, LibrarySpec, PromptSpec, ToolSpec } from "./parser/prompt";
import { generatePrompt } from "./parser/prompt";
import type {
  ActionEvent,
  BuiltinActionType,
  FunctionSchema,
  JSONSchemaDef,
  LibraryJSONSchema,
} from "./parser/types";
import { isReactiveSchema, markReactive } from "./reactive";
import {
  assertV4Schema,
  getUnionOptions,
  getZodDef,
  schemaIdTags,
  schemaSignature,
  tagSchemaId,
  unwrap,
  type SchemaRegistry,
} from "./signature";

export {
  defineAction,
  defineFunction,
  type DefinedAction,
  type DefinedFunction,
} from "./functions";
export type { LibraryJSONSchema } from "./parser/types";
export { buildSignature, tagSchemaId } from "./signature";

// ─── Sub-component type ──────────────────────────────────────────────────────

/**
 * Runtime shape of a parsed sub-component element as seen by parent renderers.
 */
export type SubComponentOf<P> = {
  type: "element";
  typeName: string;
  props: P;
  partial: boolean;
};

// ─── Renderer types (framework-generic) ──────────────────────────────────────

/**
 * The props passed to every component renderer.
 *
 * Framework adapters narrow `RenderNode`:
 * - React:  RenderNode = ReactNode
 * - Svelte: RenderNode = Snippet<[unknown]>
 * - Vue:    RenderNode = VNode
 */
export interface ComponentRenderProps<P = Record<string, unknown>, RenderNode = unknown> {
  props: P;
  renderNode: (value: unknown) => RenderNode;
  /** The statement ID from the parsed program (e.g., "header", "prose1"). Undefined for inline components. */
  statementId?: string;
}

// ─── DefinedComponent (framework-generic) ────────────────────────────────────

/**
 * A fully defined component. The `C` parameter represents the
 * framework-specific component/renderer type. lang-core never
 * inspects this value — it is stored opaquely and consumed
 * by the framework adapter's Renderer.
 */
export interface DefinedComponent<T extends z.$ZodObject = z.$ZodObject, C = unknown> {
  name: string;
  props: T;
  description: string;
  component: C;
  /** Use in parent schemas: `z.array(ChildComponent.ref)` */
  ref: z.$ZodType<SubComponentOf<T extends z.$ZodType<infer O> ? O : any>>;
}

/**
 * Define a component with name, schema, description, and renderer.
 * Tags the schema with the component name so it resolves in prompt
 * signatures even if the component isn't in every library.
 */
export function defineComponent<T extends z.$ZodObject, C>(config: {
  name: string;
  props: T;
  description: string;
  component: C;
}): DefinedComponent<T, C> {
  assertV4Schema(config.props, config.name);
  tagSchemaId(config.props, config.name);
  return {
    ...config,
    ref: config.props as unknown as z.$ZodType<
      SubComponentOf<T extends z.$ZodType<infer O> ? O : any>
    >,
  };
}

// ─── Groups & Prompt Options ─────────────────────────────────────────────────

export interface ComponentGroup {
  name: string;
  components: string[];
  notes?: string[];
}

/** Tool descriptor for prompt generation — simple string or rich ToolSpec. */
export type ToolDescriptor = string | ToolSpec;

export interface PromptOptions {
  preamble?: string;
  additionalRules?: string[];
  /** Examples shown when no tools are present (static/layout patterns). */
  examples?: string[];
  /** Examples shown when tools ARE present (Query/Mutation patterns). Takes priority over `examples`. */
  toolExamples?: string[];
  /** Available tools for Query() — string names or rich ToolSpec descriptors injected into the prompt. */
  tools?: ToolDescriptor[];
  /** Enable edit-mode instructions in the prompt. */
  editMode?: boolean;
  /** Enable inline mode — LLM can respond with text + optional openui-lang fenced code. */
  inlineMode?: boolean;
  /** Enable Query(), Mutation(), @Run, tool workflow. Default: true if tools provided. */
  toolCalls?: boolean;
  /** Enable $variables, @Set, @Reset, interactive filters. Default: true if toolCalls. */
  bindings?: boolean;
  /** List the built-in functions (@Count, @Sum, ...). Default: true if toolCalls or bindings. */
  builtinFunctions?: boolean;
}

function buildComponentSpecs(
  components: Record<string, DefinedComponent<any, any>>,
  reg: SchemaRegistry,
): Record<string, ComponentPromptSpec> {
  const specs: Record<string, ComponentPromptSpec> = {};
  for (const [name, def] of Object.entries(components)) {
    specs[name] = {
      signature: schemaSignature(name, def.props, undefined, reg),
      description: def.description,
    };
  }
  return specs;
}

type CallDefinition = DefinedFunction<any, any> | DefinedAction<any>;

/** Function or action specs in the same shape as component specs. Undefined when there are none. */
function buildCallSpecs(
  calls: Record<string, CallDefinition>,
  reg: SchemaRegistry,
): Record<string, ComponentPromptSpec> | undefined {
  const entries = Object.entries(calls);
  if (!entries.length) return undefined;
  const specs: Record<string, ComponentPromptSpec> = {};
  for (const [name, def] of entries) {
    specs[name] = {
      signature: schemaSignature(name, def.params, "returns" in def ? def.returns : undefined, reg),
      description: def.description,
    };
  }
  return specs;
}

// ─── Library ────────────────────────────────────────────────────────────────

type AnyAction = DefinedAction<any, string>;

export interface Library<C = unknown, A extends AnyAction = AnyAction> {
  readonly components: Record<string, DefinedComponent<any, C>>;
  readonly componentGroups: ComponentGroup[] | undefined;
  /** Library functions keyed by name; optional so hand-built libraries without them still type-check. */
  readonly functions?: Record<string, DefinedFunction<any, any>>;
  /** Custom actions keyed by name; optional like `functions`. */
  readonly actions?: { readonly [K in A as K["name"]]: K };
  readonly root: string | undefined;
  readonly id: string | undefined;
  /** Instance id minted by `createLibrary()`. Distinct from the optional public `id`. */
  readonly __libraryId: string;

  prompt(options?: PromptOptions): string;
  toSpec(): PromptSpec;
  toJSONSchema(): LibraryJSONSchema;
  /** Derive a new library (the base stays untouched); create it at module scope, parsers memoize by identity. */
  extend?<A2 extends AnyAction = never>(
    extension: LibraryExtension<C, A2>,
  ): Required<Library<C, A | A2>>;
}

export interface LibraryExtension<C = unknown, A extends AnyAction = AnyAction> {
  components?: {
    /** New components; with `slots` ("Parent.prop", or "Parent" with one slot) they join those unions. */
    add?: (DefinedComponent<any, C> | { component: DefinedComponent<any, C>; slots: string[] })[];
    /** Replacements (schema and renderer) by name. Every parent points at the new one. */
    override?: DefinedComponent<any, C>[];
    /** Names to drop from the library, every parent union and componentGroups. */
    remove?: string[];
  };
  functions?: ExtensionVerbs<DefinedFunction<any, any>>;
  actions?: ExtensionVerbs<A>;
}

interface ExtensionVerbs<T> {
  /** Joins the library and is listed in the prompt. */
  add?: T[];
}

type LibraryAction<L> = L extends { readonly actions?: infer R }
  ? NonNullable<R>[keyof NonNullable<R>]
  : never;
type CustomActionEvent<A> =
  A extends DefinedAction<infer T, infer N>
    ? Omit<ActionEvent, "type" | "params"> & { type: N; params: z.infer<T> }
    : never;

/** The `onAction` event for library `L`: a union discriminated on `type` when it has custom actions. */
export type LibraryActionEvent<L> = [LibraryAction<L>] extends [never]
  ? ActionEvent
  : string extends LibraryAction<L>["name"]
    ? ActionEvent
    : | (Omit<ActionEvent, "type"> & { type: `${BuiltinActionType}` | "custom" })
      | CustomActionEvent<LibraryAction<L>>;

export interface LibraryDefinition<C = unknown, A extends AnyAction = AnyAction> {
  components: DefinedComponent<any, C>[];
  componentGroups?: ComponentGroup[];
  /** Library functions, called as `@Name(...)` in programs. */
  functions?: DefinedFunction<any, any>[];
  /** Custom actions, used as `@Name(...)` steps in action props. */
  actions?: A[];
  root?: string;
  id?: string;
}

// ─── library.extend ─────────────────────────────────────────────────────────

type Comp<C> = DefinedComponent<any, C>;

const fail = (message: string): never => {
  throw new Error(`[extend] ${message}`);
};

// add ProductCard into "Card", remove Frame -> the base parts with Card, every parent and the groups updated
function extendDefinition<C>(
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
function warnOnStaleNames<L extends Required<Library<any, any>>>(
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

let fallbackLibraryId = 0;

function createLibraryId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  fallbackLibraryId += 1;
  return `openui-lib-${Date.now().toString(36)}-${fallbackLibraryId.toString(36)}`;
}

/**
 * Create a component library from an array of defined components.
 */
// A defaults to never so a library without actions extends to a real union.
export function createLibrary<C = unknown, A extends AnyAction = never>(
  input: LibraryDefinition<C, A>,
): Required<Library<C, A>> {
  const componentsRecord: Record<string, DefinedComponent<any, C>> = {};
  const reg = z.registry<{ id: string }>();
  const __libraryId = createLibraryId();

  for (const comp of input.components) {
    reg.add(comp.props as z.$ZodType, { id: comp.name });
    componentsRecord[comp.name] = comp;
  }

  // Action slots are $refs like component slots; a component of the same name wins
  for (const [id, schema] of Object.entries(ACTION_DEFS)) {
    if (!componentsRecord[id]) reg.add(schema, { id });
  }

  if (input.root && !componentsRecord[input.root]) {
    const available = Object.keys(componentsRecord).join(", ");
    throw new Error(
      `[createLibrary] Root component "${input.root}" was not found in components. Available components: ${available}`,
    );
  }

  const names = new Set(Object.keys(componentsRecord));
  const claim = (kind: string, name: string) => {
    if (isBuiltin(name) || isReservedCall(name) || names.has(name)) {
      throw new Error(
        `[createLibrary] ${kind} "${name}" collides with a built-in, component, function, or action of the same name. Rename it.`,
      );
    }
    names.add(name);
  };
  const functionsRecord: Record<string, DefinedFunction<any, any>> = {};
  for (const fn of input.functions ?? []) {
    claim("Function", fn.name);
    functionsRecord[fn.name] = fn;
  }
  const actionsRecord: Record<string, DefinedAction<any>> = {};
  for (const action of input.actions ?? []) {
    claim("Action", action.name);
    actionsRecord[action.name] = action;
    reg.add(action.ref, { id: action.name });
  }
  const callSpecs = () => {
    const functions = buildCallSpecs(functionsRecord, reg);
    const actions = buildCallSpecs(actionsRecord, reg);
    return { ...(functions ? { functions } : {}), ...(actions ? { actions } : {}) };
  };

  const library: Required<Library<C, A>> = {
    components: componentsRecord,
    componentGroups: input.componentGroups,
    functions: functionsRecord,
    actions: actionsRecord as Required<Library<C, A>>["actions"],
    root: input.root,
    id: input.id,
    __libraryId,

    prompt(options?: PromptOptions): string {
      const spec: PromptSpec = {
        root: input.root,
        components: buildComponentSpecs(componentsRecord, reg),
        componentGroups: input.componentGroups,
        ...callSpecs(),
        ...options,
      };
      return generatePrompt(spec);
    },

    toSpec(): LibrarySpec {
      return {
        root: input.root,
        components: buildComponentSpecs(componentsRecord, reg),
        componentGroups: input.componentGroups,
        ...callSpecs(),
        schema: buildJSONSchema(),
        ...(input.id !== undefined ? { id: input.id } : {}),
      };
    },

    toJSONSchema(): LibraryJSONSchema {
      return buildJSONSchema();
    },

    // lib.extend({ components: { add: [ProductCard] }, functions: { add: [percent] } })
    extend<A2 extends AnyAction = never>(extension: LibraryExtension<C, A2>) {
      const { definition, removed } = extendDefinition<C>(input, extension);
      const derived = createLibrary(definition) as Required<Library<C, A | A2>>;
      return warnOnStaleNames(library, derived, removed);
    },
  };

  // Component refs resolve against the library's top-level $defs
  function toCallJSONSchema(schema: z.$ZodType): Record<string, unknown> {
    const { $schema: _, $defs: __, ...rest } = z.toJSONSchema(schema, { metadata: reg });
    return rest;
  }

  function callSchemas(
    calls: Record<string, CallDefinition>,
  ): Record<string, FunctionSchema> | undefined {
    const entries = Object.entries(calls);
    if (!entries.length) return undefined;
    return Object.fromEntries(
      entries.map(([name, def]) => [
        name,
        {
          description: def.description,
          params: toCallJSONSchema(def.params) as JSONSchemaDef,
          ...("returns" in def && def.returns ? { returns: toCallJSONSchema(def.returns) } : {}),
        },
      ]),
    );
  }

  function buildJSONSchema(): LibraryJSONSchema {
    const combinedSchema = zObject(
      Object.fromEntries(Object.entries(componentsRecord).map(([k, v]) => [k, v.props])) as any,
    );
    const schema = z.toJSONSchema(combinedSchema, { metadata: reg }) as LibraryJSONSchema;
    // zod only serializes what lives on the zod schemas / the metadata
    // registry, so component descriptions (a defineComponent field) must be
    // merged in explicitly — without this the serialized library loses them.
    for (const [name, comp] of Object.entries(componentsRecord)) {
      const def = schema.$defs?.[name];
      if (def && comp.description) def.description = comp.description;
    }
    const functions = callSchemas(functionsRecord);
    if (functions) schema.functions = functions;
    const actions = callSchemas(actionsRecord);
    if (actions) schema.actions = actions;
    return schema;
  }

  return library;
}
