import { z } from "zod";
import type { Model } from "../defineModel";
import { getZodDef, getZodType } from "./zod";

/**
 * Walk root models' `schema` fields recursively and collect all named sub-models.
 * Sub-models are discovered via `z.globalRegistry` — any schema registered with
 * `{ id, description }` is treated as a named model.
 *
 * Returns roots first, followed by all discovered sub-models (deduplicated by name).
 */
export function collectModels(roots: Model[]): Model[] {
  const seen = new Set<string>(roots.map((r) => r.name));
  const results: Model[] = [...roots];

  for (const root of roots) {
    collectFromSchema(root.schema, seen, results);
  }

  return results;
}

function collectFromSchema(
  schema: unknown,
  seen: Set<string>,
  results: Model[],
): void {
  if (!schema || typeof schema !== "object") return;

  const def = getZodDef(schema);
  if (!def) return;

  const type = getZodType(schema);

  let children: unknown[] = [];
  if (type === "object") {
    const shape = def.shape;
    if (shape && typeof shape === "object") {
      children = Object.values(shape as Record<string, unknown>);
    }
  } else if (type === "array") {
    const element = def.element ?? def.innerType;
    if (element != null) children = [element];
  } else if (type === "optional") {
    const inner = def.innerType;
    if (inner != null) children = [inner];
  } else if (type === "union") {
    if (Array.isArray(def.options)) children = def.options;
  }

  for (const child of children) {
    if (!child || typeof child !== "object") continue;

    try {
      const meta = z.globalRegistry.get(child as z.ZodType);
      if (meta?.id && meta?.description) {
        const name = meta.id as string;
        if (!seen.has(name)) {
          seen.add(name);
          results.push({
            name,
            description: meta.description as string,
            schema: child as z.ZodObject<any>,
            ref: child as z.ZodObject<any>,
          });
          // Recurse into this model's schema to find its sub-models
          collectFromSchema(child, seen, results);
        }
      } else {
        // Not a registered model, but might contain registered models
        collectFromSchema(child, seen, results);
      }
    } catch {
      collectFromSchema(child, seen, results);
    }
  }
}
