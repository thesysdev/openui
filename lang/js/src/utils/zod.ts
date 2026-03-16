import { z } from "zod";

export function getZodDef(schema: unknown): any {
  return (schema as any)?._zod?.def;
}

export function getZodType(schema: unknown): string | undefined {
  return getZodDef(schema)?.type;
}

export function isOptionalType(schema: unknown): boolean {
  return getZodType(schema) === "optional";
}

export function unwrapOptional(schema: unknown): unknown {
  const def = getZodDef(schema);
  if (def?.type === "optional") return def.innerType;
  return schema;
}

/** Strip optional wrapper to reach the core schema. */
export function unwrap(schema: unknown): unknown {
  return unwrapOptional(schema);
}

export function isArrayType(schema: unknown): boolean {
  const s = unwrap(schema);
  return getZodType(s) === "array";
}

export function getArrayInnerType(schema: unknown): unknown | undefined {
  const s = unwrap(schema);
  const def = getZodDef(s);
  if (def?.type === "array") return def.element ?? def.innerType;
  return undefined;
}

export function getEnumValues(schema: unknown): string[] | undefined {
  const s = unwrap(schema);
  const def = getZodDef(s);
  if (def?.type !== "enum") return undefined;
  if (Array.isArray(def.values)) return def.values;
  if (def.entries && typeof def.entries === "object") return Object.keys(def.entries);
  return undefined;
}

export function getSchemaId(schema: unknown): string | undefined {
  try {
    const meta = z.globalRegistry.get(schema as z.ZodType);
    return meta?.id;
  } catch {
    return undefined;
  }
}

export function getUnionOptions(schema: unknown): unknown[] | undefined {
  const def = getZodDef(schema);
  if (def?.type === "union" && Array.isArray(def.options)) return def.options;
  return undefined;
}

export function getObjectShape(schema: unknown): Record<string, unknown> | undefined {
  const def = getZodDef(schema);
  if (def?.type === "object" && def.shape && typeof def.shape === "object")
    return def.shape as Record<string, unknown>;
  return undefined;
}

/**
 * Resolve the type annotation for a schema field.
 * Returns a human-readable type string for the schema.
 *
 * Examples:
 *  - z.string()                   → "string"
 *  - z.number()                   → "number"
 *  - z.boolean()                  → "boolean"
 *  - z.enum(["a","b"])            → '"a" | "b"'
 *  - z.array(TabItemSchema)       → "TabItem[]"
 *  - z.union([Input, TextArea])   → "Input | TextArea"
 *  - z.array(z.union([A, B]))     → "(A | B)[]"
 *  - ButtonGroupSchema            → "ButtonGroup"
 *  - z.object({src: z.string()})  → "{src: string}" (inline when unregistered)
 */
export function resolveTypeAnnotation(schema: unknown): string | undefined {
  const inner = unwrap(schema);

  const directId = getSchemaId(inner);
  if (directId) return directId;

  const unionOpts = getUnionOptions(inner);
  if (unionOpts) {
    const resolved = unionOpts.map((o) => resolveTypeAnnotation(o));
    const names = resolved.filter(Boolean) as string[];
    if (names.length > 0) {
      if (names.length < unionOpts.length) {
        console.warn(
          `[prompt] Partially resolved union: ${names.length}/${unionOpts.length} options resolved`,
        );
      }
      return names.join(" | ");
    }
  }

  if (isArrayType(schema)) {
    const arrayInner = getArrayInnerType(schema);
    if (!arrayInner) return undefined;

    const innerType = resolveTypeAnnotation(arrayInner);
    if (innerType) {
      const isUnion = getUnionOptions(unwrap(arrayInner)) !== undefined;
      return isUnion ? `(${innerType})[]` : `${innerType}[]`;
    }

    console.warn(
      `[prompt] Could not resolve array element type (inner zod type: "${getZodType(arrayInner) ?? "unknown"}")`,
    );
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

  if (zodType === "lazy") {
    console.warn(
      `[prompt] z.lazy() schemas are not resolved — remove z.lazy() wrapper from the schema`,
    );
  } else if (zodType) {
    console.warn(`[prompt] Unresolved schema type: "${zodType}"`);
  }

  return undefined;
}
