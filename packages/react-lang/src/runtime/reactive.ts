// ─────────────────────────────────────────────────────────────────────────────
// Reactive schema marker for openui-lang
// ─────────────────────────────────────────────────────────────────────────────

import type { z } from "zod";
import type { StateField } from "./state-field";

// ── reactive() schema marker ────────────────────────────────────────────────

/** WeakSet tracks reactive schemas without mutating the schema objects. */
const reactiveSchemas = new WeakSet<object>();

/**
 * Mark a schema prop as reactive so runtime evaluation can preserve $bindings.
 *
 * Uses a module-level WeakSet instead of mutating the Zod schema instance,
 * avoiding side effects on shared schema objects.
 *
 * The widened return type carries the eventual value shape into helpers like
 * `useStateField()`. The actual bound value is still resolved at render time.
 */
export function reactive<T extends z.ZodType>(schema: T): z.ZodType<StateField<z.infer<T>>> {
  reactiveSchemas.add(schema);
  return schema as unknown as z.ZodType<StateField<z.infer<T>>>;
}

export function isReactiveSchema(schema: unknown): boolean {
  return typeof schema === "object" && schema !== null && reactiveSchemas.has(schema as object);
}
