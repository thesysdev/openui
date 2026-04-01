/**
 * Evaluate-tree: entry point for evaluating ElementNode prop trees.
 *
 * Delegates to the evaluator's schema-aware evaluation when schema context
 * is available. This ensures reactive schemas, ActionPlan preservation,
 * Each loop variable substitution, and ternary resolution all happen in
 * a single unified pass.
 */

import type { Library } from "../library";
import { isASTNode } from "../parser/ast";
import type { ElementNode } from "../parser/types";
import { isElementNode } from "../parser/types";
import { isReactiveSchema } from "../reactive";
import type { EvaluationContext, SchemaContext } from "./evaluator";
import { evaluate, isReactiveAssign } from "./evaluator";
import type { Store } from "./store";

/** Context passed through the evaluation chain — no module-level state. */
export interface EvalContext {
  /** AST evaluation context (getState, resolveRef) */
  ctx: EvaluationContext;
  /** Component library for reactive schema lookup */
  library: Library;
  /** Reactive binding store (null in v1 mode) */
  store: Store | null;
}

/**
 * Evaluate all AST nodes in an ElementNode tree's props.
 * Returns a new ElementNode with all props resolved to concrete values.
 *
 * Uses the unified evaluator with schema context for reactive-aware evaluation.
 */
export function evaluateElementProps(el: ElementNode, evalCtx: EvalContext): ElementNode {
  if (el.hasDynamicProps === false) return el;

  const schemaCtx: SchemaContext = { library: evalCtx.library };
  const def = evalCtx.library.components[el.typeName];
  const evaluated: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(el.props)) {
    const propSchema = def?.props?.shape?.[key];
    evaluated[key] = evaluatePropValue(value, evalCtx, schemaCtx, propSchema);
  }

  return { ...el, props: evaluated };
}

/**
 * Evaluate a single prop value with schema awareness.
 */
function evaluatePropValue(
  value: unknown,
  evalCtx: EvalContext,
  schemaCtx: SchemaContext,
  reactiveSchema?: unknown,
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
    // Evaluate with schema context — handles Comp, Each, ternary with reactive awareness
    const result = evaluate(value, evalCtx.ctx, schemaCtx);
    // ElementNode result (from ternary/Comp) → recurse into its props
    if (isElementNode(result)) {
      return evaluateElementProps(result as ElementNode, evalCtx);
    }
    // Array result (from Each) → recurse into any ElementNodes
    if (Array.isArray(result)) {
      return result.map((item) =>
        isElementNode(item) ? evaluateElementProps(item as ElementNode, evalCtx) : item,
      );
    }
    // Strip ReactiveAssign from non-reactive props
    if (isReactiveAssign(result) && !(reactiveSchema && isReactiveSchema(reactiveSchema))) {
      return evalCtx.ctx.getState(result.target) ?? null;
    }
    return result;
  }

  // String on reactive schema → pass through (useStateField resolves at render time)
  if (typeof value === "string" && reactiveSchema && isReactiveSchema(reactiveSchema)) {
    return value;
  }

  // Array — recurse
  if (Array.isArray(value)) {
    return value.map((v) => evaluatePropValue(v, evalCtx, schemaCtx, reactiveSchema));
  }

  // ElementNode — recurse with schema
  if (isElementNode(value)) {
    return evaluateElementProps(value as ElementNode, evalCtx);
  }

  // ActionPlan / ActionStep — preserve as-is (deferred click-time evaluation)
  const obj = value as Record<string, unknown>;
  if ("steps" in obj && Array.isArray(obj.steps)) return value;
  if ("type" in obj && "valueAST" in obj) return value;

  // Plain data object — recurse if contains nested objects
  let needsEval = false;
  for (const val of Object.values(obj)) {
    if (typeof val === "object" && val !== null) {
      needsEval = true;
      break;
    }
  }
  if (needsEval) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      result[key] = evaluatePropValue(val, evalCtx, schemaCtx);
    }
    return result;
  }

  return value;
}
