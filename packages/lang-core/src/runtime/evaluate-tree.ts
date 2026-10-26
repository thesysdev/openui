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
import {
  isElementNode,
  isPendingSlot,
  type ElementNode,
  type OpenUIError,
  type ParseResult,
} from "../parser/types";
import { evaluatePropCore } from "./evaluate-prop";
import { evaluate, type EvaluationContext, type SchemaContext } from "./evaluator";
import type { Store } from "./store";

/** Context passed through the evaluation chain — no module-level state. */
export interface EvalContext {
  /** AST evaluation context (getState, resolveRef) */
  ctx: EvaluationContext;
  /** Component library for reactive schema lookup */
  library: Library;
  /** Reactive binding store (null in v1 mode) */
  store: Store | null;
  /** Runtime errors collected during prop evaluation (optional — populated by evaluateElementProps). */
  errors?: OpenUIError[];
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

  let key = "";
  const report = (msg: string) => {
    evalCtx.errors?.push({
      source: "runtime",
      code: "runtime-error",
      component: el.typeName,
      statementId: el.statementId,
      message: `Evaluating prop "${key}" on ${el.typeName} failed: ${msg}`,
      hint: `Check the expression used for prop "${key}"`,
    });
  };
  // Library function calls and actions that fail report why here
  const propCtx =
    evalCtx.ctx.functions || evalCtx.ctx.actions
      ? { ...evalCtx, ctx: { ...evalCtx.ctx, reportError: report } }
      : evalCtx;

  for (const [propKey, value] of Object.entries(el.props)) {
    key = propKey;
    const propSchema = def?.props?.shape?.[key];
    try {
      evaluated[key] = evaluatePropValue(value, propCtx, schemaCtx, propSchema);
    } catch (e) {
      // Use raw value as fallback for this prop, collect structured error
      evaluated[key] = value;
      report(e instanceof Error ? e.message : String(e));
    }
  }

  return { ...el, props: evaluated };
}

/** Evaluate `root`, or the component a runtime entry (`rootExpression`) picks; null if none. */
export function evaluateRoot(
  result: Pick<ParseResult, "root" | "rootExpression">,
  evalCtx: EvalContext,
): ElementNode | null {
  if (result.root) return evaluateElementProps(result.root, evalCtx);
  if (!result.rootExpression) return null;
  const value = evaluate(result.rootExpression, evalCtx.ctx, { library: evalCtx.library });
  if (isElementNode(value)) return evaluateElementProps(value, evalCtx);
  evalCtx.errors?.push({
    source: "runtime",
    code: "no-root",
    statementId: "root",
    message: "root does not evaluate to a component",
  });
  return null;
}

/**
 * Evaluate a single prop value with schema awareness.
 * Delegates to shared evaluatePropCore with evaluate-tree-specific recursion callbacks.
 */
function evaluatePropValue(
  value: unknown,
  evalCtx: EvalContext,
  schemaCtx: SchemaContext,
  reactiveSchema?: unknown,
): unknown {
  return evaluatePropCore(value, evalCtx.ctx, schemaCtx, reactiveSchema, {
    recurseElement: (el) => evaluateElementProps(el, evalCtx),
    recurse: (v, rs) => evaluatePropValue(v, evalCtx, schemaCtx, rs),
  });
}

/**
 * Ordered reveal for a tree parsed with `pendingSlots`: everything after the first
 * pending slot in reading order (props in order, depth first) is held back, so while
 * streaming new content only appears at the end. Lists after the hold point are empty,
 * other values keep theirs, and no pending slot is left in the output. Works on parsed
 * trees (AST nodes are kept as they are) and evaluated ones. Returns the same node when
 * nothing is held, so a complete parse passes through unchanged.
 */
export function revealInOrder(root: ElementNode): ElementNode {
  let held = false;
  const visit = (value: unknown): unknown => {
    if (value == null || typeof value !== "object" || isASTNode(value)) return value;
    if (Array.isArray(value)) {
      if (held) return value.length ? [] : value;
      let out: unknown[] | undefined;
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        if (isPendingSlot(item)) {
          held = true;
          return out ?? value.slice(0, i);
        }
        const next = visit(item);
        if (next !== item && !out) out = value.slice(0, i);
        out?.push(next);
        // The hold point was inside this item: later siblings wait
        if (held) return out ?? value.slice(0, i + 1);
      }
      return out ?? value;
    }
    const obj = isElementNode(value) ? value.props : (value as Record<string, unknown>);
    let changed: Record<string, unknown> | undefined;
    for (const [key, item] of Object.entries(obj)) {
      const next = visit(item);
      if (next !== item) (changed ??= { ...obj })[key] = next;
    }
    if (!changed) return value;
    return isElementNode(value) ? { ...value, props: changed } : changed;
  };
  return visit(root) as ElementNode;
}
