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
  /** Library functions keyed by name. Empty when the library has none. */
  readonly functions: Record<string, DefinedFunction<any, any>>;
  /** Custom actions keyed by name. Empty when the library has none. */
  readonly actions: { readonly [K in A as K["name"]]: K };
  readonly root: string | undefined;
  readonly id: string | undefined;
  /** Instance id minted by `createLibrary()`. Distinct from the optional public `id`. */
  readonly __libraryId: string;

  prompt(options?: PromptOptions): string;
  toSpec(): PromptSpec;
  toJSONSchema(): LibraryJSONSchema;
  /** Derive a new library (the base stays untouched); create it at module scope, parsers memoize by identity. */
  extend<A2 extends AnyAction = never>(extension: LibraryExtension<C, A2>): Library<C, A | A2>;
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
  add?: T[];
  /** Not supported yet: throws. */
  override?: T[];
  /** Not supported yet: throws. */
  remove?: string[];
}

type LibraryAction<L> = L extends { readonly actions: infer R } ? R[keyof R] : never;
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

function extendDefinition<C>(
  base: LibraryDefinition<C, AnyAction>,
  ext: LibraryExtension<C, AnyAction>,
): { definition: LibraryDefinition<C, AnyAction>; removed: string[] } {
  const fail = (message: string): never => {
    throw new Error(`[extend] ${message}`);
  };
  for (const kind of ["functions", "actions"] as const)
    for (const verb of ["override", "remove"] as const)
      if (ext[kind]?.[verb]) fail(`${kind}.${verb} is not supported yet.`);
  type Comp = DefinedComponent<any, C>;
  const byName = new Map<string, Comp>(base.components.map((c) => [c.name, c]));
  // Every schema that stands for a component, old, new or removed, mapped to its name.
  const nameOf = new Map<unknown, string>(base.components.map((c) => [c.props, c.name]));
  const put = (comp: Comp) => {
    byName.set(comp.name, comp);
    nameOf.set(comp.props, comp.name);
  };
  const { add = [], override = [], remove = [] } = ext.components ?? {};
  const wantedSlots = new Map<string, string[]>();
  const touched = new Set<string>(); // added or overridden in this call
  for (const entry of add) {
    const { component: comp, slots } =
      "slots" in entry ? entry : { component: entry, slots: undefined };
    if (byName.has(comp.name)) fail(`Component "${comp.name}" already exists. Use override.`);
    if (slots?.length === 0) fail(`"slots" for "${comp.name}" is empty. Omit it to only list it.`);
    put(comp);
    touched.add(comp.name);
    if (slots) wantedSlots.set(comp.name, slots);
  }
  const overridden = new Set<string>();
  for (const comp of override) {
    if (!byName.has(comp.name))
      fail(`Cannot override "${comp.name}": not in the library. Use add.`);
    if (overridden.has(comp.name)) fail(`Component "${comp.name}" is overridden twice.`);
    overridden.add(comp.name);
    touched.add(comp.name);
    put(comp);
  }
  const removed = new Set(remove);
  for (const name of removed) {
    if (touched.has(name))
      fail(`Cannot remove "${name}": it is added or overridden in the same call.`);
    if (!byName.delete(name)) fail(`Cannot remove "${name}": not in the library.`);
    if (name === base.root) fail(`Cannot remove "${name}": it is the library root.`);
  }

  // A slot is a prop holding, through optional and array wrappers, a union of component refs.
  const slotUnion = (s: unknown): unknown => {
    const inner = unwrap(s);
    const def = getZodDef(inner);
    if (def?.type === "array") return slotUnion(def.element);
    return getUnionOptions(inner)?.some((o) => nameOf.has(o)) ? inner : undefined;
  };
  const slots = [...byName.values()].flatMap((c) =>
    Object.entries(c.props.shape)
      .filter(([, s]) => slotUnion(s))
      .map(([p]) => `${c.name}.${p}`),
  );
  const addedTo = new Map<string, string[]>(); // "Parent.prop" -> added names
  for (const [name, wanted] of wantedSlots) {
    for (const slot of wanted) {
      const parent = slot.split(".")[0]!;
      const candidates = slots.filter((p) => p.startsWith(`${parent}.`));
      const path = slots.includes(slot)
        ? slot
        : !slot.includes(".") && candidates.length === 1
          ? candidates[0]!
          : fail(
              !byName.has(parent)
                ? `Slot "${slot}" for "${name}": "${parent}" is not in the library.`
                : !candidates.length
                  ? `Slot "${slot}" for "${name}": "${parent}" has no content slot (a prop holding a union of components).`
                  : `Slot "${slot}" for "${name}" must be one content slot. Candidates: ${candidates.join(", ")}.`,
            );
      addedTo.set(path, [...(addedTo.get(path) ?? []), name]);
    }
  }

  // Rebuild components so refs point at the final ones; unchanged schemas keep their identity
  type Slot = { path: string; union: unknown; extra: unknown[] };
  const done = new Map<string, Comp>();
  const finalProps = (name: string): z.$ZodObject => {
    const comp = byName.get(name)!;
    if (done.has(name)) return done.get(name)!.props;
    done.set(name, comp); // cycle guard
    const shape = comp.props.shape as Record<string, unknown>;
    const next = Object.fromEntries(
      Object.entries(shape).map(([k, s]) => {
        const path = `${name}.${k}`;
        const extra = (addedTo.get(path) ?? []).map(finalProps);
        return [k, rebind(s, { path, union: slotUnion(s), extra }, new Map())];
      }),
    );
    if (Object.keys(next).every((k) => next[k] === shape[k])) return comp.props;
    const props = cloneSchema(comp.props, { shape: next }) as z.$ZodObject;
    tagSchemaId(props, name);
    done.set(name, { ...comp, props, ref: props as unknown as Comp["ref"] });
    return props;
  };
  const onlyType = (name: string | undefined, slot: Slot): never =>
    fail(`Cannot remove "${name}": it is the only type allowed in ${slot.path}.`);
  const rebind = (s: unknown, slot: Slot, memo: Map<unknown, unknown>): unknown => {
    const name = nameOf.get(s);
    if (name !== undefined) return removed.has(name) ? onlyType(name, slot) : finalProps(name);
    const def = getZodDef(s);
    if (!def || def.type === "lazy" || memo.has(s)) return memo.get(s) ?? s;
    memo.set(s, s);
    let options = getUnionOptions(s);
    if (options?.some((o) => nameOf.has(o))) {
      const kept = options.filter((o) => !removed.has(nameOf.get(o) ?? ""));
      if (!kept.length) onlyType(nameOf.get(options[0]), slot);
      options = s === slot.union ? [...kept, ...slot.extra.filter((e) => !kept.includes(e))] : kept;
    }
    const patch: Record<string, unknown> = {};
    const map = (c: unknown) => rebind(c, slot, memo);
    for (const [k, v] of Object.entries(options ? { ...def, options } : def)) {
      if (k === "checks") continue;
      const next = getZodDef(v)
        ? map(v)
        : Array.isArray(v)
          ? v.map(map)
          : k === "shape"
            ? Object.fromEntries(Object.entries(v as object).map(([n, c]) => [n, map(c)]))
            : v;
      // Arrays and shapes are rebuilt each time, so compare their entries.
      const old = def[k];
      const changed =
        next !== old &&
        (getZodDef(next) ||
          Object.keys(next as object).length !== Object.keys(old).length ||
          Object.entries(next as object).some(([i, c]) => c !== old[i]));
      if (changed) patch[k] = next;
    }
    const out = Object.keys(patch).length ? cloneSchema(s, patch) : s;
    memo.set(s, out);
    return out;
  };
  for (const name of byName.keys()) finalProps(name);

  return {
    definition: {
      ...base,
      // A derived library is a new library: it does not take the base's public id
      id: undefined,
      components: [...byName.keys()].map((n) => done.get(n)!),
      componentGroups: base.componentGroups
        ?.map((g) => ({ ...g, components: g.components.filter((n) => !removed.has(n)) }))
        .filter((g) => g.components.length),
      functions: [...(base.functions ?? []), ...(ext.functions?.add ?? [])],
      actions: [...(base.actions ?? []), ...(ext.actions?.add ?? [])],
    },
    removed: [...removed],
  };
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
let fallbackLibraryId = 0;

/** Removed component names a library's prompt notes, examples or rules may still name. */
const staleNames = new WeakMap<object, string[]>();

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
): Library<C, A> {
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

  const library: Library<C, A> = {
    components: componentsRecord,
    componentGroups: input.componentGroups,
    functions: functionsRecord,
    actions: actionsRecord as Library<C, A>["actions"],
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

    extend<A2 extends AnyAction = never>(extension: LibraryExtension<C, A2>) {
      const { definition, removed: newlyRemoved } = extendDefinition<C>(input, extension);
      const derived = createLibrary(definition) as Library<C, A | A2>;
      // Names removed earlier in a chain of extends stay stale until re-added or warned
      let removed = [...new Set([...(staleNames.get(library) ?? []), ...newlyRemoved])].filter(
        (n) => !(n in derived.components),
      );
      if (!removed.length) return derived;
      // Group notes are checked now; examples and rules arrive with prompt(). Warns once per name.
      const warnIfNamed = (texts: string[]) => {
        const named = removed.filter((n) => texts.some((t) => new RegExp(`\\b${n}\\b`).test(t)));
        if (!named.length) return;
        removed = removed.filter((n) => !named.includes(n));
        staleNames.set(derived, removed);
        console.warn(
          `[extend] Removed ${named.join(", ")} still named in prompt notes, examples or rules.`,
        );
      };
      staleNames.set(derived, removed);
      warnIfNamed(definition.componentGroups?.flatMap((g) => g.notes ?? []) ?? []);
      const { prompt } = derived;
      return Object.assign(derived, {
        prompt(options?: PromptOptions) {
          const { examples = [], toolExamples = [], additionalRules = [] } = options ?? {};
          warnIfNamed([...examples, ...toolExamples, ...additionalRules]);
          return prompt(options);
        },
      });
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
