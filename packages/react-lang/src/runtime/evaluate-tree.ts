/**
 * Evaluate-tree: framework-agnostic prop evaluation for ElementNode trees.
 *
 * Walks an ElementNode tree and evaluates all AST nodes in props to concrete
 * values. This moves evaluation OUT of the Renderer — the Renderer receives
 * fully-evaluated props and just renders.
 *
 * Handles:
 *   - AST nodes (StateRef, RuntimeRef, BinOp, Member, etc.) → evaluate to values
 *   - Nested ElementNodes (e.g. Series inside Chart) → recurse into props
 *   - StateRef + reactive schema → emits ReactiveAssign for useStateField() at render time
 *   - Plain objects with embedded AST (e.g. table row data) → recurse
 */

import type { ElementNode } from "@openuidev/lang-core";
import { isASTNode } from "@openuidev/lang-core";
import type { Library } from "../library";
import type { EvaluationContext } from "./evaluator";
import { evaluate, isReactiveAssign } from "./evaluator";
import { isReactiveSchema } from "./reactive";
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
 * Recursively evaluate any AST nodes found in a prop value.
 * Returns concrete values — no AST nodes survive.
 */
function evaluatePropValue(
  value: unknown,
  evalCtx: EvalContext,
  reactiveSchema?: unknown,
): unknown {
  if (value == null) return value;
  if (typeof value !== "object") return value;

  // AST node — evaluate it
  if (isASTNode(value)) {
    // For reactive schema props with a StateRef, emit ReactiveAssign.
    // Do NOT resolve to StateField here — FormNameContext isn't available yet.
    // Components call useStateField() at render time for correct form scope.
    if (value.k === "StateRef" && reactiveSchema && isReactiveSchema(reactiveSchema)) {
      return {
        __reactive: "assign" as const,
        target: value.n,
        expr: { k: "StateRef" as const, n: "$value" },
      };
    }
    const result = evaluate(value, evalCtx.ctx);
    // Strip ReactiveAssign from non-reactive props — resolve to current state value
    if (isReactiveAssign(result) && !(reactiveSchema && isReactiveSchema(reactiveSchema))) {
      return evalCtx.ctx.getState(result.target) ?? null;
    }
    return result;
  }

  // Non-reactive string on a reactive schema — pass through as-is.
  // Components call useStateField() which resolves strings via form state.
  if (typeof value === "string" && reactiveSchema && isReactiveSchema(reactiveSchema)) {
    return value;
  }

  // Array — recurse
  if (Array.isArray(value)) {
    return value.map((v) => evaluatePropValue(v, evalCtx, reactiveSchema));
  }

  // ElementNode — recurse into its props
  const obj = value as Record<string, unknown>;
  if (obj.type === "element" && obj.props) {
    return {
      ...obj,
      props: evaluateProps(obj.props as Record<string, unknown>, evalCtx, obj.typeName as string),
    };
  }

  // Plain data objects — recurse into values if any contain objects
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
      result[key] = evaluatePropValue(val, evalCtx);
    }
    return result;
  }

  return value;
}

/**
 * Evaluate all props of an element, handling reactive schema detection.
 */
function evaluateProps(
  props: Record<string, unknown>,
  evalCtx: EvalContext,
  typeName?: string,
): Record<string, unknown> {
  const def = typeName ? evalCtx.library.components[typeName] : undefined;
  const evaluated: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    // Check if this prop has a reactive schema (for StateRef → ReactiveAssign passthrough)
    const propSchema = def?.props?.shape?.[key];
    evaluated[key] = evaluatePropValue(value, evalCtx, propSchema);
  }

  return evaluated;
}

/**
 * Evaluate all AST nodes in an ElementNode tree's props.
 * Returns a new ElementNode with all props resolved to concrete values.
 *
 * Call this BEFORE passing to the Renderer.
 */
export function evaluateElementProps(el: ElementNode, evalCtx: EvalContext): ElementNode {
  // Skip evaluation for elements with no dynamic props
  if (el.hasDynamicProps === false) return el;

  const evaluatedProps = evaluateProps(el.props, evalCtx, el.typeName);
  return { ...el, props: evaluatedProps };
}
