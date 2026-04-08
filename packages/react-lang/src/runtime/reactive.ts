// ─────────────────────────────────────────────────────────────────────────────
// Reactive schema marker for openui-lang (React adapter)
// ─────────────────────────────────────────────────────────────────────────────

import type { StateField } from "@openuidev/lang-core";
import { markReactive } from "@openuidev/lang-core";
import type { z } from "zod";

// Re-export for internal use
export { isReactiveSchema } from "@openuidev/lang-core";

/**
 * Mark a schema prop as reactive so runtime evaluation can preserve $bindings.
 *
 * The widened return type carries the eventual value shape into helpers like
 * `useStateField()`. The actual bound value is still resolved at render time.
 */
export function reactive<T extends z.ZodType>(schema: T): z.ZodType<StateField<z.infer<T>>> {
  markReactive(schema);
  return schema as unknown as z.ZodType<StateField<z.infer<T>>>;
}
