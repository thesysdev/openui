import * as z from "zod/v4/core";
import type { ActionRef } from "./parser/builtins";
import { isReactiveSchema } from "./reactive";

// Zod introspection and the one prompt signature builder for components,
// functions and actions.

// ─── Schema ID tagging ─────────────────────────────────────────────────────
// WeakMap-based naming for schemas. defineComponent tags component schemas
// automatically. tagSchemaId is exported for non-component schemas
// (e.g. ActionExpression) that also need friendly names in prompts.

export const schemaIdTags = new WeakMap<object, string>();

/**
 * Tag a schema with an ID for prompt signatures.
 * Use for non-component schemas that need friendly type names (e.g. ActionExpression).
 * This affects prompt output only, not JSON Schema $defs.
 */
export function tagSchemaId(schema: object, id: string): void {
  schemaIdTags.set(schema, id);
}

// Action refs print as `@Name` in signatures: share?: @CopyToClipboard | @OpenUrl
const actionRefTags = new WeakMap<object, string>();

// actionRef("OpenUrl", data) -> `$defs.OpenUrl` = data in JSON, `@OpenUrl` in prompt signatures
export function actionRef(name: string, data: z.$ZodType): ActionRef {
  actionRefTags.set(data, name);
  return data as unknown as ActionRef;
}

// ─── Zod v3 detection ──────────────────────────────────────────────────────

export function assertV4Schema(schema: unknown, componentName: string): void {
  if (schema != null && typeof schema === "object" && "_def" in schema && !("_zod" in schema)) {
    throw new Error(
      `[OpenUI] Component "${componentName}" was defined with a Zod 3 schema. ` +
        `OpenUI requires Zod 4 schemas. ` +
        `If you're on zod@3.25+, import from "zod/v4" instead of "zod". ` +
        `See: https://zod.dev/v4/versioning`,
    );
  }
}

// ─── Zod introspection ──────────────────────────────────────────────────────

export function getZodDef(schema: unknown): any {
  return (schema as any)?._zod?.def;
}

function getZodType(schema: unknown): string | undefined {
  return getZodDef(schema)?.type;
}

function isOptionalType(schema: unknown): boolean {
  const type = getZodType(schema);
  return type === "optional" || type === "default" || type === "nullable";
}

export function unwrap(schema: unknown): unknown {
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

export type SchemaRegistry = ReturnType<typeof z.registry<{ id: string }>>;

function getSchemaId(schema: unknown, reg?: SchemaRegistry): string | undefined {
  // Check per-library registry first
  try {
    const meta = reg?.get(schema as z.$ZodType) as { id?: string } | undefined;
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

export function getUnionOptions(schema: unknown): unknown[] | undefined {
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
function resolveTypeAnnotation(schema: unknown, reg?: SchemaRegistry): string | undefined {
  const isReactive = isReactiveSchema(schema);
  const inner = unwrap(schema);

  const baseType = resolveBaseType(inner, reg);
  if (!baseType) return undefined;
  return isReactive ? `$binding<${baseType}>` : baseType;
}

function resolveBaseType(inner: unknown, reg?: SchemaRegistry): string | undefined {
  const actionRef = typeof inner === "object" && inner !== null && actionRefTags.get(inner);
  if (actionRef) return `@${actionRef}`;
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

function analyzeFields(shape: Record<string, z.$ZodType>, reg?: SchemaRegistry): FieldInfo[] {
  return Object.entries(shape).map(([name, schema]) => ({
    name,
    isOptional: isOptionalType(schema),
    isArray: isArrayType(schema),
    typeAnnotation: resolveTypeAnnotation(schema, reg),
  }));
}

export function buildSignature(componentName: string, fields: FieldInfo[]): string {
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

/**
 * Prompt signature of a component, function or action: `Name(a: T, b?: U)`,
 * plus ` → R` when it declares a return type. Key order is the positional order.
 */
export function schemaSignature(
  name: string,
  params: z.$ZodObject,
  returns?: z.$ZodType,
  reg?: SchemaRegistry,
): string {
  const signature = buildSignature(name, analyzeFields(params._zod.def.shape, reg));
  const type = returns && resolveTypeAnnotation(returns, reg);
  return type ? `${signature} → ${type}` : signature;
}
