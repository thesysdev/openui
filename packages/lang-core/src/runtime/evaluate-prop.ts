/**
 * Shared prop value evaluation logic.
 *
 * Both evaluator.ts (inline path) and evaluate-tree.ts (React path) need
 * identical prop evaluation — AST resolution, ReactiveAssign handling,
 * ElementNode recursion, ActionPlan preservation. The only difference is
 * how they recurse into ElementNodes. This module extracts the shared core
 * and takes recursion callbacks so each caller can supply its own strategy.
 *
 * Also fixes the nested reactive drop bug: reactiveSchema is now correctly
 * passed through plain object recursion.
 */

import { isASTNode } from "../parser/ast";
import type { ElementNode } from "../parser/types";
import { isElementNode } from "../parser/types";
import { isReactiveSchema } from "../reactive";
import type { EvaluationContext, SchemaContext } from "./evaluator";
import { evaluate, isReactiveAssign } from "./evaluator";

export interface PropEvalCallbacks {
  /** How to recurse into an ElementNode (evaluator vs evaluate-tree differ here). */
  recurseElement: (el: ElementNode) => ElementNode;
  /** How to self-recurse for a prop value. */
  recurse: (value: unknown, reactiveSchema?: unknown) => unknown;
}

/**
 * Evaluate a single prop value with schema awareness. Handles AST nodes,
 * ReactiveAssign markers, nested ElementNodes, arrays, and ActionPlans.
 */
export function evaluatePropCore(
  value: unknown,
  context: EvaluationContext,
  schemaCtx: SchemaContext,
  reactiveSchema: unknown | undefined,
  callbacks: PropEvalCallbacks,
): unknown {
  if (value == null) return value;
  if (typeof value !== "object") return value;

  // AST node — evaluate with schema context
  if (isASTNode(value)) {
    // StateRef on reactive prop → ReactiveAssign marker
    if (value.k === "StateRef" && reactiveSchema && isReactiveSchema(reactiveSchema)) {
      return {
        __reactive: "assign" as const,
        target: value.n,
        expr: { k: "StateRef" as const, n: "$value" },
      };
    }
    const result = evaluate(value, context, schemaCtx);
    // ElementNode result (from ternary/Comp) → recurse into its props
    if (isElementNode(result)) {
      return callbacks.recurseElement(result as ElementNode);
    }
    // Array result (from Each) → recurse into any ElementNodes
    if (Array.isArray(result)) {
      return result.map((item) =>
        isElementNode(item) ? callbacks.recurseElement(item as ElementNode) : item,
      );
    }
    // Strip ReactiveAssign from non-reactive props
    if (isReactiveAssign(result) && !(reactiveSchema && isReactiveSchema(reactiveSchema))) {
      return context.getState(result.target) ?? null;
    }
    return result;
  }

  // String on reactive schema → pass through (component's useStateField resolves it)
  if (typeof value === "string" && reactiveSchema && isReactiveSchema(reactiveSchema)) {
    return value;
  }

  // Array — recurse
  if (Array.isArray(value)) {
    return value.map((v) => callbacks.recurse(v, reactiveSchema));
  }

  // ElementNode — recurse with schema
  if (isElementNode(value)) {
    return callbacks.recurseElement(value as ElementNode);
  }

  // ActionPlan / ActionStep — preserve as-is (deferred click-time evaluation)
  const obj = value as Record<string, unknown>;
  if ("steps" in obj && Array.isArray(obj.steps)) return value;
  if ("type" in obj && "valueAST" in obj) return value;

  // Plain data object — recurse if contains nested objects
  // NOTE: reactiveSchema is passed through — fixes nested reactive drop bug
  let needsEval = false;
  for (const val of Object.values(obj)) {
    if (typeof val === "object" && val !== null) {
      needsEval = true;
      break;
    }
  }
  if (needsEval) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = callbacks.recurse(v, reactiveSchema);
    }
    return result;
  }

  return value;
}
