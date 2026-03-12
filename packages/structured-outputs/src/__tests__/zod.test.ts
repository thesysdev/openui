import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  getZodDef,
  getZodType,
  isOptionalType,
  unwrapOptional,
  unwrap,
  isArrayType,
  getArrayInnerType,
  getEnumValues,
  getSchemaId,
  getUnionOptions,
  getObjectShape,
  resolveTypeAnnotation,
} from "../utils/zod";

describe("getZodDef", () => {
  it("returns the internal _zod.def for a Zod schema", () => {
    const schema = z.string();
    const def = getZodDef(schema);
    expect(def).toBeDefined();
    expect(def.type).toBe("string");
  });

  it("returns undefined for non-Zod values", () => {
    expect(getZodDef(null)).toBeUndefined();
    expect(getZodDef(undefined)).toBeUndefined();
    expect(getZodDef("hello")).toBeUndefined();
    expect(getZodDef(42)).toBeUndefined();
    expect(getZodDef({})).toBeUndefined();
  });
});

describe("getZodType", () => {
  it("returns the type string for primitive schemas", () => {
    expect(getZodType(z.string())).toBe("string");
    expect(getZodType(z.number())).toBe("number");
    expect(getZodType(z.boolean())).toBe("boolean");
  });

  it("returns 'optional' for optional schemas", () => {
    expect(getZodType(z.string().optional())).toBe("optional");
  });

  it("returns 'array' for array schemas", () => {
    expect(getZodType(z.array(z.string()))).toBe("array");
  });

  it("returns 'object' for object schemas", () => {
    expect(getZodType(z.object({ x: z.string() }))).toBe("object");
  });

  it("returns 'enum' for enum schemas", () => {
    expect(getZodType(z.enum(["a", "b"]))).toBe("enum");
  });

  it("returns undefined for non-Zod values", () => {
    expect(getZodType(null)).toBeUndefined();
    expect(getZodType(42)).toBeUndefined();
  });
});

describe("isOptionalType", () => {
  it("returns true for optional schemas", () => {
    expect(isOptionalType(z.string().optional())).toBe(true);
    expect(isOptionalType(z.number().optional())).toBe(true);
  });

  it("returns false for required schemas", () => {
    expect(isOptionalType(z.string())).toBe(false);
    expect(isOptionalType(z.number())).toBe(false);
    expect(isOptionalType(z.array(z.string()))).toBe(false);
  });
});

describe("unwrapOptional / unwrap", () => {
  it("strips the optional wrapper", () => {
    const inner = z.string();
    const optional = inner.optional();
    const unwrapped = unwrapOptional(optional);
    expect(getZodType(unwrapped)).toBe("string");
  });

  it("returns the schema unchanged when not optional", () => {
    const schema = z.number();
    expect(unwrapOptional(schema)).toBe(schema);
  });

  it("unwrap delegates to unwrapOptional", () => {
    const optional = z.boolean().optional();
    expect(getZodType(unwrap(optional))).toBe("boolean");

    const required = z.string();
    expect(unwrap(required)).toBe(required);
  });
});

describe("isArrayType", () => {
  it("returns true for z.array()", () => {
    expect(isArrayType(z.array(z.string()))).toBe(true);
  });

  it("returns true for optional arrays", () => {
    expect(isArrayType(z.array(z.string()).optional())).toBe(true);
  });

  it("returns false for non-array types", () => {
    expect(isArrayType(z.string())).toBe(false);
    expect(isArrayType(z.object({}))).toBe(false);
    expect(isArrayType(z.number())).toBe(false);
  });
});

describe("getArrayInnerType", () => {
  it("returns the inner element type of an array", () => {
    const inner = z.string();
    const arr = z.array(inner);
    const result = getArrayInnerType(arr);
    expect(getZodType(result)).toBe("string");
  });

  it("returns the inner type through optional wrappers", () => {
    const arr = z.array(z.number()).optional();
    const result = getArrayInnerType(arr);
    expect(getZodType(result)).toBe("number");
  });

  it("returns undefined for non-array types", () => {
    expect(getArrayInnerType(z.string())).toBeUndefined();
    expect(getArrayInnerType(z.object({}))).toBeUndefined();
  });
});

describe("getEnumValues", () => {
  it("returns values for z.enum()", () => {
    const vals = getEnumValues(z.enum(["a", "b", "c"]));
    expect(vals).toEqual(["a", "b", "c"]);
  });

  it("returns values for optional enums", () => {
    const vals = getEnumValues(z.enum(["x", "y"]).optional());
    expect(vals).toEqual(["x", "y"]);
  });

  it("returns undefined for non-enum types", () => {
    expect(getEnumValues(z.string())).toBeUndefined();
    expect(getEnumValues(z.number())).toBeUndefined();
    expect(getEnumValues(z.array(z.string()))).toBeUndefined();
  });
});

describe("getSchemaId", () => {
  it("returns the id when registered in globalRegistry", () => {
    const schema = z.object({ x: z.string() });
    (schema as any).register(z.globalRegistry, { id: "ZodTestSchema" });
    expect(getSchemaId(schema)).toBe("ZodTestSchema");
  });

  it("returns undefined for unregistered schemas", () => {
    const schema = z.object({ y: z.number() });
    expect(getSchemaId(schema)).toBeUndefined();
  });

  it("returns undefined for non-Zod values", () => {
    expect(getSchemaId(null)).toBeUndefined();
    expect(getSchemaId("string")).toBeUndefined();
  });
});

describe("getUnionOptions", () => {
  it("returns options for z.union()", () => {
    const opts = getUnionOptions(z.union([z.string(), z.number()]));
    expect(opts).toBeDefined();
    expect(opts).toHaveLength(2);
  });

  it("returns undefined for non-union types", () => {
    expect(getUnionOptions(z.string())).toBeUndefined();
    expect(getUnionOptions(z.array(z.string()))).toBeUndefined();
  });
});

describe("getObjectShape", () => {
  it("returns shape for z.object()", () => {
    const shape = getObjectShape(z.object({ a: z.string(), b: z.number() }));
    expect(shape).toBeDefined();
    expect(Object.keys(shape!)).toEqual(["a", "b"]);
  });

  it("returns undefined for non-object types", () => {
    expect(getObjectShape(z.string())).toBeUndefined();
    expect(getObjectShape(z.array(z.string()))).toBeUndefined();
  });
});

describe("resolveTypeAnnotation", () => {
  it("resolves primitive types", () => {
    expect(resolveTypeAnnotation(z.string())).toBe("string");
    expect(resolveTypeAnnotation(z.number())).toBe("number");
    expect(resolveTypeAnnotation(z.boolean())).toBe("boolean");
  });

  it("resolves optional primitives", () => {
    expect(resolveTypeAnnotation(z.string().optional())).toBe("string");
    expect(resolveTypeAnnotation(z.number().optional())).toBe("number");
  });

  it("resolves enum types", () => {
    const result = resolveTypeAnnotation(z.enum(["a", "b", "c"]));
    expect(result).toBe('"a" | "b" | "c"');
  });

  it("resolves registered schema by id", () => {
    const schema = z.object({ v: z.string() });
    (schema as any).register(z.globalRegistry, { id: "ResolveTestType" });
    expect(resolveTypeAnnotation(schema)).toBe("ResolveTestType");
  });

  it("resolves array of primitives", () => {
    expect(resolveTypeAnnotation(z.array(z.string()))).toBe("string[]");
    expect(resolveTypeAnnotation(z.array(z.number()))).toBe("number[]");
  });

  it("resolves array of registered types", () => {
    const inner = z.object({ name: z.string() });
    (inner as any).register(z.globalRegistry, { id: "ArrElemType" });
    expect(resolveTypeAnnotation(z.array(inner))).toBe("ArrElemType[]");
  });

  it("resolves union types", () => {
    const a = z.object({ x: z.string() });
    (a as any).register(z.globalRegistry, { id: "UnionA" });
    const b = z.object({ y: z.number() });
    (b as any).register(z.globalRegistry, { id: "UnionB" });
    expect(resolveTypeAnnotation(z.union([a, b]))).toBe("UnionA | UnionB");
  });

  it("resolves array of unions with parentheses", () => {
    const a = z.object({ x: z.string() });
    (a as any).register(z.globalRegistry, { id: "ArrUnionA" });
    const b = z.object({ y: z.number() });
    (b as any).register(z.globalRegistry, { id: "ArrUnionB" });
    expect(resolveTypeAnnotation(z.array(z.union([a, b])))).toBe("(ArrUnionA | ArrUnionB)[]");
  });

  it("resolves inline object shapes", () => {
    const obj = z.object({ src: z.string(), alt: z.string().optional() });
    const result = resolveTypeAnnotation(obj);
    expect(result).toBe("{src: string, alt?: string}");
  });

  it("returns undefined for unresolvable types", () => {
    expect(resolveTypeAnnotation(null)).toBeUndefined();
  });
});
