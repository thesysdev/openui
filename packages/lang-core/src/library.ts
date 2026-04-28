import { object as zObject } from "zod/v4";
import * as z from "zod/v4/core";
import type { ComponentPromptSpec, PromptSpec, ToolSpec } from "./parser/prompt";
import { generatePrompt } from "./parser/prompt";
import type { LibraryJSONSchema } from "./parser/types";
import { isReactiveSchema } from "./reactive";

export type { LibraryJSONSchema } from "./parser/types";

// ─── Schema ID tagging ─────────────────────────────────────────────────────
// WeakMap-based naming for schemas. defineComponent tags component schemas
// automatically. tagSchemaId is exported for non-component schemas
// (e.g. ActionExpression) that also need friendly names in prompts.

const schemaIdTags = new WeakMap<object, string>();

/**
 * Tag a schema with an ID for prompt signatures.
 * Use for non-component schemas that need friendly type names (e.g. ActionExpression).
 * This affects prompt output only, not JSON Schema $defs.
 */
export function tagSchemaId(schema: object, id: string): void {
  schemaIdTags.set(schema, id);
}

// ─── Zod v3 detection ──────────────────────────────────────────────────────

function assertV4Schema(schema: unknown, componentName: string): void {
  if (schema != null && typeof schema === "object" && "_def" in schema && !("_zod" in schema)) {
    throw new Error(
      `[OpenUI] Component "${componentName}" was defined with a Zod 3 schema. ` +
        `OpenUI requires Zod 4 schemas. ` +
        `If you're on zod@3.25+, import from "zod/v4" instead of "zod". ` +
        `See: https://zod.dev/v4/versioning`,
    );
  }
}

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
  schemaIdTags.set(config.props, config.name);
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
}

// ─── Zod introspection ──────────────────────────────────────────────────────

function getZodDef(schema: unknown): any {
  return (schema as any)?._zod?.def;
}

function getZodType(schema: unknown): string | undefined {
  return getZodDef(schema)?.type;
}

function isOptionalType(schema: unknown): boolean {
  const type = getZodType(schema);
  return type === "optional" || type === "default" || type === "nullable";
}

function unwrap(schema: unknown): unknown {
  let s = schema;
  let def = getZodDef(s);
  while (def?.type === "optional" || def?.type === "default" || def?.type === "nullable") {
    s = def.innerType;
    def = getZodDef(s);
  }
  return s;
}

function isArrayType(schema: unknown): boolean {
  const s = unwrap(schema);
  return getZodType(s) === "array";
}

function getArrayInnerType(schema: unknown): unknown | undefined {
  const s = unwrap(schema);
  const def = getZodDef(s);
  if (def?.type === "array") return def.element ?? def.innerType;
  return undefined;
}

function getEnumValues(schema: unknown): string[] | undefined {
  const s = unwrap(schema);
  const def = getZodDef(s);
  if (def?.type !== "enum") return undefined;
  if (Array.isArray(def.values)) return def.values;
  if (def.entries && typeof def.entries === "object") return Object.keys(def.entries);
  return undefined;
}

type SchemaRegistry = ReturnType<typeof z.registry<{ id: string }>>;

function getSchemaId(schema: unknown, reg: SchemaRegistry): string | undefined {
  // Check per-library registry first
  try {
    const meta = reg.get(schema as z.$ZodType) as { id?: string } | undefined;
    if (meta?.id) return meta.id;
  } catch {
    // not registered — fall through
  }
  // Fallback: WeakMap tags from defineComponent / tagSchemaId
  if (typeof schema === "object" && schema !== null) {
    return schemaIdTags.get(schema);
  }
  return undefined;
}

function getUnionOptions(schema: unknown): unknown[] | undefined {
  const def = getZodDef(schema);
  if (def?.type === "union" && Array.isArray(def.options)) return def.options;
  return undefined;
}

function getObjectShape(schema: unknown): Record<string, unknown> | undefined {
  const def = getZodDef(schema);
  if (def?.type === "object" && def.shape && typeof def.shape === "object")
    return def.shape as Record<string, unknown>;
  return undefined;
}

/**
 * Resolve the type annotation for a schema field.
 * Returns a human-readable type string for the schema.
 * If the schema is marked reactive(), prefixes with "$binding<...>".
 */
function resolveTypeAnnotation(schema: unknown, reg: SchemaRegistry): string | undefined {
  const isReactive = isReactiveSchema(schema);
  const inner = unwrap(schema);

  const baseType = resolveBaseType(inner, reg);
  if (!baseType) return undefined;
  return isReactive ? `$binding<${baseType}>` : baseType;
}

function resolveBaseType(inner: unknown, reg: SchemaRegistry): string | undefined {
  const directId = getSchemaId(inner, reg);
  if (directId) return directId;

  const unionOpts = getUnionOptions(inner);
  if (unionOpts) {
    const resolved = unionOpts.map((o) => resolveTypeAnnotation(o, reg));
    const names = resolved.filter(Boolean) as string[];
    if (names.length > 0) return names.join(" | ");
  }

  if (isArrayType(inner)) {
    const arrayInner = getArrayInnerType(inner);
    if (!arrayInner) return undefined;
    const innerType = resolveTypeAnnotation(arrayInner, reg);
    if (innerType) {
      const isUnion = getUnionOptions(unwrap(arrayInner)) !== undefined;
      return isUnion ? `(${innerType})[]` : `${innerType}[]`;
    }
    return undefined;
  }

  const zodType = getZodType(inner);
  if (zodType === "string") return "string";
  if (zodType === "number") return "number";
  if (zodType === "boolean") return "boolean";
  if (zodType === "any") return "any";

  if (zodType === "record") {
    const def = getZodDef(inner);
    const keyType = resolveTypeAnnotation(def?.keyType, reg) ?? "string";
    const valueType = resolveTypeAnnotation(def?.valueType, reg) ?? "any";
    return `Record<${keyType}, ${valueType}>`;
  }

  const enumVals = getEnumValues(inner);
  if (enumVals) return enumVals.map((v) => `"${v}"`).join(" | ");

  if (zodType === "literal") {
    const vals = getZodDef(inner)?.values;
    if (Array.isArray(vals) && vals.length === 1) {
      const v = vals[0];
      return typeof v === "string" ? `"${v}"` : String(v);
    }
  }

  const shape = getObjectShape(inner);
  if (shape) {
    const fields = Object.entries(shape).map(([name, fieldSchema]) => {
      const opt = isOptionalType(fieldSchema) ? "?" : "";
      const fieldType = resolveTypeAnnotation(fieldSchema as z.$ZodType, reg);
      return fieldType ? `${name}${opt}: ${fieldType}` : `${name}${opt}`;
    });
    return `{${fields.join(", ")}}`;
  }

  // Fallback for unrecognized Zod types (z.tuple, z.date, etc.)
  // "any" is safer than undefined — the LLM sees `param: any` instead of bare `param`
  return "any";
}

// ─── Field analysis & signature generation ──────────────────────────────────

interface FieldInfo {
  name: string;
  isOptional: boolean;
  isArray: boolean;
  typeAnnotation?: string;
}

function analyzeFields(shape: Record<string, z.$ZodType>, reg: SchemaRegistry): FieldInfo[] {
  return Object.entries(shape).map(([name, schema]) => ({
    name,
    isOptional: isOptionalType(schema),
    isArray: isArrayType(schema),
    typeAnnotation: resolveTypeAnnotation(schema, reg),
  }));
}

function buildSignature(componentName: string, fields: FieldInfo[]): string {
  const params = fields.map((f) => {
    if (f.typeAnnotation) {
      return f.isOptional ? `${f.name}?: ${f.typeAnnotation}` : `${f.name}: ${f.typeAnnotation}`;
    }
    if (f.isArray) {
      return f.isOptional ? `[${f.name}]?` : `[${f.name}]`;
    }
    return f.isOptional ? `${f.name}?` : f.name;
  });
  return `${componentName}(${params.join(", ")})`;
}

function buildComponentSpecs(
  components: Record<string, DefinedComponent<any, any>>,
  reg: SchemaRegistry,
): Record<string, ComponentPromptSpec> {
  const specs: Record<string, ComponentPromptSpec> = {};
  for (const [name, def] of Object.entries(components)) {
    const fields = analyzeFields(def.props.shape, reg);
    specs[name] = {
      signature: buildSignature(name, fields),
      description: def.description,
    };
  }
  return specs;
}

// ─── Library ────────────────────────────────────────────────────────────────

export interface Library<C = unknown> {
  readonly components: Record<string, DefinedComponent<any, C>>;
  readonly componentGroups: ComponentGroup[] | undefined;
  readonly root: string | undefined;

  prompt(options?: PromptOptions): string;
  toSpec(): PromptSpec;
  toJSONSchema(): LibraryJSONSchema;
}

export interface LibraryDefinition<C = unknown> {
  components: DefinedComponent<any, C>[];
  componentGroups?: ComponentGroup[];
  root?: string;
}

/**
 * Create a component library from an array of defined components.
 */
export function createLibrary<C = unknown>(input: LibraryDefinition<C>): Library<C> {
  const componentsRecord: Record<string, DefinedComponent<any, C>> = {};
  const reg = z.registry<{ id: string }>();

  for (const comp of input.components) {
    reg.add(comp.props as z.$ZodType, { id: comp.name });
    componentsRecord[comp.name] = comp;
  }

  if (input.root && !componentsRecord[input.root]) {
    const available = Object.keys(componentsRecord).join(", ");
    throw new Error(
      `[createLibrary] Root component "${input.root}" was not found in components. Available components: ${available}`,
    );
  }

  const library: Library<C> = {
    components: componentsRecord,
    componentGroups: input.componentGroups,
    root: input.root,

    prompt(options?: PromptOptions): string {
      const spec: PromptSpec = {
        root: input.root,
        components: buildComponentSpecs(componentsRecord, reg),
        componentGroups: input.componentGroups,
        ...options,
      };
      return generatePrompt(spec);
    },

    toSpec(): PromptSpec {
      return {
        root: input.root,
        components: buildComponentSpecs(componentsRecord, reg),
        componentGroups: input.componentGroups,
      };
    },

    toJSONSchema(): LibraryJSONSchema {
      const combinedSchema = zObject(
        Object.fromEntries(Object.entries(componentsRecord).map(([k, v]) => [k, v.props])) as any,
      );
      return z.toJSONSchema(combinedSchema, { metadata: reg }) as LibraryJSONSchema;
    },
  };

  return library;
}
