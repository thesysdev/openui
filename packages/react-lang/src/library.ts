import type {
  ComponentGroup,
  ComponentPromptSpec,
  LibraryJSONSchema,
  McpToolSpec,
  PromptSpec,
} from "@openuidev/lang-core";
import { generatePrompt } from "@openuidev/lang-core";
import type { ReactNode } from "react";
import { z } from "zod";
import { isReactiveSchema } from "./runtime/reactive";

// Re-export ComponentGroup from lang-core (canonical definition)
export type { ComponentGroup } from "@openuidev/lang-core";

// ─── Sub-component type ──────────────────────────────────────────────────────

/**
 * Runtime shape of a parsed sub-component element as seen by parent renderers.
 */
export type SubComponentOf<P> = {
  /** Source variable name. Undefined for inline components. */
  statementId?: string;
  type: "element";
  typeName: string;
  props: P;
  partial: boolean;
};

// ─── Renderer types ───────────────────────────────────────────────────────────

export interface ComponentRenderProps<P = Record<string, unknown>> {
  props: P;
  renderNode: (value: unknown) => ReactNode;
}

export type ComponentRenderer<P = Record<string, unknown>> = React.FC<ComponentRenderProps<P>>;

// ─── DefinedComponent ─────────────────────────────────────────────────────────

/**
 * A fully defined component with name, schema, description, renderer,
 * and a `.ref` for type-safe cross-referencing in parent schemas.
 */
export interface DefinedComponent<T extends z.ZodObject<any> = z.ZodObject<any>> {
  name: string;
  props: T;
  description: string;
  component: ComponentRenderer<z.infer<T>>;
  /** Use in parent schemas: `z.array(ChildComponent.ref)` */
  ref: z.ZodType<SubComponentOf<z.infer<T>>>;
}

/**
 * Define a component with name, schema, description, and renderer.
 * Registers the Zod schema globally and returns a `.ref` for parent schemas.
 *
 * @example
 * ```ts
 * const TabItem = defineComponent({
 *   name: "TabItem",
 *   props: z.object({ value: z.string(), trigger: z.string(), content: z.array(ContentChildUnion) }),
 *   description: "Tab panel",
 *   component: () => null,
 * });
 *
 * const Tabs = defineComponent({
 *   name: "Tabs",
 *   props: z.object({ items: z.array(TabItem.ref) }),
 *   description: "Tabbed container",
 *   component: ({ props, renderNode }) => {
 *     props.items.map(item => renderNode(item.props.content));
 *   },
 * });
 * ```
 */
export function defineComponent<T extends z.ZodObject<any>>(config: {
  name: string;
  props: T;
  description: string;
  component: ComponentRenderer<z.infer<T>>;
}): DefinedComponent<T> {
  (config.props as any).register(z.globalRegistry, { id: config.name });
  return {
    ...config,
    /** Schema-composition marker for use with z.array() or z.union(). Not for runtime .parse() validation. */
    ref: config.props as unknown as z.ZodType<SubComponentOf<z.infer<T>>>,
  };
}

// ─── Prompt Options ──────────────────────────────────────────────────────────

/** Tool descriptor for prompt generation — simple string or rich McpToolSpec. */
export type ToolDescriptor = string | McpToolSpec;

export interface PromptOptions {
  preamble?: string;
  additionalRules?: string[];
  /** Examples shown when no tools are present (static/layout patterns). */
  examples?: string[];
  /** Examples shown when tools ARE present (Query/Mutation patterns). Takes priority over `examples`. */
  toolExamples?: string[];
  /** Available tools for Query() — string names or rich McpToolSpec descriptors injected into the prompt. */
  tools?: ToolDescriptor[];
  /** Enable edit-mode instructions in the prompt. */
  editMode?: boolean;
  /** Enable inline mode — LLM can respond with text + optional ```openui-lang fenced code.
   *  The parser extracts code from fences automatically. Text outside fences is shown as chat. */
  inlineMode?: boolean;
}

// ─── Zod introspection (moved from prompt.ts) ────────────────────────────────

function getZodDef(schema: unknown): any {
  return (schema as any)?._zod?.def;
}

function getZodType(schema: unknown): string | undefined {
  return getZodDef(schema)?.type;
}

function isOptionalType(schema: unknown): boolean {
  return getZodType(schema) === "optional";
}

function unwrapOptional(schema: unknown): unknown {
  const def = getZodDef(schema);
  if (def?.type === "optional") return def.innerType;
  return schema;
}

/** Strip optional wrapper to reach the core schema. */
function unwrap(schema: unknown): unknown {
  return unwrapOptional(schema);
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

function getSchemaId(schema: unknown): string | undefined {
  try {
    const meta = z.globalRegistry.get(schema as z.ZodType);
    return meta?.id;
  } catch {
    return undefined;
  }
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
function resolveTypeAnnotation(schema: unknown): string | undefined {
  // Check for reactive marker
  const isReactive = isReactiveSchema(schema);
  const inner = unwrap(schema);

  const baseType = resolveBaseType(inner);
  if (!baseType) return undefined;
  return isReactive ? `$binding<${baseType}>` : baseType;
}

function resolveBaseType(inner: unknown): string | undefined {
  const directId = getSchemaId(inner);
  if (directId) return directId;

  const unionOpts = getUnionOptions(inner);
  if (unionOpts) {
    const resolved = unionOpts.map((o) => resolveTypeAnnotation(o));
    const names = resolved.filter(Boolean) as string[];
    if (names.length > 0) return names.join(" | ");
  }

  if (isArrayType(inner)) {
    const arrayInner = getArrayInnerType(inner);
    if (!arrayInner) return undefined;
    const innerType = resolveTypeAnnotation(arrayInner);
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
      const fieldType = resolveTypeAnnotation(fieldSchema as z.ZodType);
      return fieldType ? `${name}${opt}: ${fieldType}` : `${name}${opt}`;
    });
    return `{${fields.join(", ")}}`;
  }

  return undefined;
}

// ─── Field analysis ──────────────────────────────────────────────────────────

interface FieldInfo {
  name: string;
  isOptional: boolean;
  isArray: boolean;
  typeAnnotation?: string;
}

function analyzeFields(shape: Record<string, z.ZodType>): FieldInfo[] {
  return Object.entries(shape).map(([name, schema]) => ({
    name,
    isOptional: isOptionalType(schema),
    isArray: isArrayType(schema),
    typeAnnotation: resolveTypeAnnotation(schema),
  }));
}

// ─── Signature generation ────────────────────────────────────────────────────

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

// ─── Build PromptSpec from Library ───────────────────────────────────────────

function buildComponentSpecs(
  components: Record<string, DefinedComponent>,
): Record<string, ComponentPromptSpec> {
  const specs: Record<string, ComponentPromptSpec> = {};
  for (const [name, def] of Object.entries(components)) {
    const fields = analyzeFields(def.props.shape);
    specs[name] = {
      signature: buildSignature(name, fields),
      description: def.description,
    };
  }
  return specs;
}

// ─── Library ──────────────────────────────────────────────────────────────────

export interface Library {
  readonly components: Record<string, DefinedComponent>;
  readonly componentGroups: ComponentGroup[] | undefined;
  readonly root: string | undefined;

  prompt(options?: PromptOptions): string;
  /**
   * Returns a JSON-serializable PromptSpec containing component signatures,
   * groups, and root name. Can be saved to disk and used with `generatePrompt()`
   * on the backend without React/Zod dependencies.
   */
  toSpec(): PromptSpec;
  /**
   * Returns a single, valid JSON Schema document for the entire library.
   * All component schemas are in `$defs`, keyed by component name.
   * Sub-schemas shared across components (e.g. `Series`, `CardHeader`) are
   * emitted once and referenced via `$ref` — no repetition.
   *
   * @example
   * ```ts
   * const schema = library.toJSONSchema();
   * // schema.$defs["Card"]   → { properties: {...}, required: [...] }
   * // schema.$defs["Series"] → { properties: {...}, required: [...] }
   * ```
   */
  toJSONSchema(): LibraryJSONSchema;
}

export interface LibraryDefinition {
  components: DefinedComponent[];
  componentGroups?: ComponentGroup[];
  root?: string;
}

/**
 * Create a component library from an array of defined components.
 *
 * @example
 * ```ts
 * const library = createLibrary({
 *   components: [TabItem, Tabs, Card],
 *   root: "Card",
 * });
 * ```
 */
export function createLibrary(input: LibraryDefinition): Library {
  const componentsRecord: Record<string, DefinedComponent> = {};
  for (const comp of input.components) {
    if (!z.globalRegistry.has(comp.props)) {
      comp.props.register(z.globalRegistry, { id: comp.name });
    }
    if (componentsRecord[comp.name]) {
      console.warn(
        `[openui] Duplicate component name "${comp.name}" — later definition overwrites`,
      );
    }
    componentsRecord[comp.name] = comp;
  }

  if (Object.keys(componentsRecord).length === 0) {
    console.warn(
      "[openui] createLibrary called with no components — prompts will reference a nonexistent root component",
    );
  }

  if (input.root && !componentsRecord[input.root]) {
    const available = Object.keys(componentsRecord).join(", ");
    throw new Error(
      `[createLibrary] Root component "${input.root}" was not found in components. Available components: ${available}`,
    );
  }

  const rootName = input.root;

  const library: Library = {
    components: componentsRecord,
    componentGroups: input.componentGroups,
    root: rootName,

    prompt(options?: PromptOptions): string {
      const spec: PromptSpec = {
        root: rootName,
        components: buildComponentSpecs(componentsRecord),
        componentGroups: input.componentGroups,
        ...options,
      };
      return generatePrompt(spec);
    },

    toSpec(): PromptSpec {
      return {
        root: rootName,
        components: buildComponentSpecs(componentsRecord),
        componentGroups: input.componentGroups,
      };
    },

    toJSONSchema(): LibraryJSONSchema {
      // Build one combined z.object so z.toJSONSchema emits all component
      // schemas into a shared $defs block — sub-schemas like CardHeader or
      // Series are defined once and referenced via $ref everywhere else.
      const combinedSchema = z.object(
        Object.fromEntries(Object.entries(componentsRecord).map(([k, v]) => [k, v.props])) as any,
      );
      return z.toJSONSchema(combinedSchema);
    },
  };

  return library;
}
