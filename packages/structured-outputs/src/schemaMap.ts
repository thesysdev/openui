import { z } from "zod";
import { defineType, type DefinedType } from "./defineType";
import { createSchema, type Schema } from "./schema";
import type { ParseResult, StreamingParser } from "./types";

/**
 * Extract the root data type from a Schema.
 * Resolves to the `root` field of the schema's ParseResult.
 */
export type RootOf<S extends Schema> = ReturnType<S["parse"]>["root"];

/**
 * A schema map combines multiple schemas into a single unified Schema
 * (with `prompt()`, `parse()`, `streamingParser()`, `toJSONSchema()`, `types`)
 * while preserving access to the individual schemas via `.schemas`.
 *
 * When individual schemas define root types, a `Root` wrapper type is created
 * automatically. The wrapper is transparent — `parse()` and `streamingParser()`
 * unwrap it so the consumer sees the inner value directly.
 */
export interface SchemaMap extends Schema {
  /** The individual schemas keyed by name, for direct access to per-schema `prompt()`, `streamingParser()`, etc. */
  readonly schemas: Record<string, Schema>;
}

/**
 * Create a schema map that merges multiple schemas into a unified Schema.
 *
 * If individual schemas define root types, a `Root` wrapper type is created
 * internally so the prompt instructs the LLM to write `root = Root(TypeName(...))`.
 * The wrapper is unwrapped automatically in parse results.
 *
 * @example
 * ```ts
 * const map = createSchemaMap({
 *   invoice: invoiceSchema,
 *   receipt: receiptSchema,
 * });
 *
 * // Prompt includes all types + Root wrapper
 * const prompt = map.prompt();
 *
 * // Parse unwraps Root automatically
 * const result = map.parse('root = Root(InvRoot("INV-001", [...]))');
 * // result.root === { number: "INV-001", items: [...] }
 * ```
 */
export function createSchemaMap(schemas: Record<string, Schema>): SchemaMap {
  const schemaKeys = Object.keys(schemas);

  if (schemaKeys.length === 0) {
    throw new Error("[createSchemaMap] At least one schema is required.");
  }

  const allTypes: DefinedType[] = [];
  const seen = new Set<string>();
  const rootDefs: DefinedType[] = [];

  for (const key of schemaKeys) {
    const s = schemas[key];
    for (const [name, def] of Object.entries(s.types)) {
      if (!seen.has(name)) {
        seen.add(name);
        allTypes.push(def);
      }
    }
    if (s.root && s.types[s.root]) {
      rootDefs.push(s.types[s.root]);
    }
  }

  if (rootDefs.length === 0) {
    const merged = createSchema({ types: allTypes });
    return { ...merged, schemas };
  }

  const rootRef =
    rootDefs.length === 1
      ? rootDefs[0].ref
      : z.union([rootDefs[0].ref, rootDefs[1].ref, ...rootDefs.slice(2).map((d) => d.ref)]);

  const rootNames = rootDefs.map((d) => d.name).join(", ");
  const RootType = defineType({
    name: "Root",
    description: `Root wrapper — use exactly one of: ${rootNames}`,
    props: z.object({ value: rootRef }),
  });

  allTypes.push(RootType);
  const merged = createSchema({ types: allTypes, root: "Root" });

  function unwrapRoot(result: ParseResult): ParseResult {
    if (result.root && typeof result.root === "object" && "value" in result.root) {
      return { ...result, root: (result.root as Record<string, unknown>).value };
    }
    return result;
  }

  return {
    ...merged,
    schemas,

    parse(input: string): ParseResult {
      return unwrapRoot(merged.parse(input));
    },

    streamingParser(): StreamingParser {
      const inner = merged.streamingParser();
      return {
        push(chunk: string) {
          return unwrapRoot(inner.push(chunk));
        },
        getResult() {
          return unwrapRoot(inner.getResult());
        },
      };
    },
  };
}
