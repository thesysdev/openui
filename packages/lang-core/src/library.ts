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
import { assertV4Schema, schemaSignature, tagSchemaId, type SchemaRegistry } from "./signature";

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
export function createLibrary<C = unknown, A extends AnyAction = AnyAction>(
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
