/**
 * Evaluate-tree: entry point for evaluating ElementNode prop trees.
 *
 * Delegates to the evaluator's schema-aware evaluation when schema context
 * is available. This ensures reactive schemas, ActionPlan preservation,
 * Each loop variable substitution, and ternary resolution all happen in
 * a single unified pass.
 */

import type { Library } from "../library";
import type { ElementNode, OpenUIError } from "../parser/types";
import { isElementNode } from "../parser/types";
import { evaluatePropCore } from "./evaluate-prop";
import type { EvaluationContext, SchemaContext } from "./evaluator";
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

type SafeParseResult =
  | { success: true; data: unknown }
  | {
      success: false;
      error?: { issues?: Array<{ message: string; path?: Array<string | number> }> };
    };

type SafeParseSchema = {
  safeParse?: (value: unknown) => SafeParseResult;
};

function containsElementNode(value: unknown, seen = new WeakSet<object>()): boolean {
  if (isElementNode(value)) return true;
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.some((item) => containsElementNode(item, seen));
  return Object.values(value as Record<string, unknown>).some((item) =>
    containsElementNode(item, seen),
  );
}

function formatZodIssues(
  propName: string,
  issues: Array<{ message: string; path?: Array<string | number> }> | undefined,
): string {
  if (!issues?.length) return `/${propName}: invalid value`;
  return issues
    .map((issue) => {
      const suffix = issue.path?.length ? `/${issue.path.join("/")}` : "";
      return `/${propName}${suffix}: ${issue.message}`;
    })
    .join("; ");
}

function validateEvaluatedProp(
  component: string,
  propName: string,
  propSchema: unknown,
  value: unknown,
  statementId: string | undefined,
  errors: OpenUIError[] | undefined,
): void {
  if (!errors || containsElementNode(value)) return;

  const safeParse = (propSchema as SafeParseSchema | undefined)?.safeParse;
  if (typeof safeParse !== "function") return;

  const result = safeParse.call(propSchema, value);
  if (result.success) return;

  errors.push({
    source: "runtime",
    code: "runtime-error",
    component,
    statementId,
    path: `/${propName}`,
    message: `Prop "${propName}" on ${component} does not match its schema: ${formatZodIssues(
      propName,
      result.error?.issues,
    )}`,
    hint: `Use a value that matches the declared schema for ${component}.${propName}.`,
  });
}

/**
 * Evaluate all AST nodes in an ElementNode tree's props.
 * Returns a new ElementNode with all props resolved to concrete values.
 *
 * Uses the unified evaluator with schema context for reactive-aware evaluation.
 */
export function evaluateElementProps(el: ElementNode, evalCtx: EvalContext): ElementNode {
  const schemaCtx: SchemaContext = { library: evalCtx.library };
  const def = evalCtx.library.components[el.typeName];
  const evaluated: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(el.props)) {
    const propSchema = def?.props?.shape?.[key];
    try {
      evaluated[key] = evaluatePropValue(value, evalCtx, schemaCtx, propSchema);
      validateEvaluatedProp(
        el.typeName,
        key,
        propSchema,
        evaluated[key],
        el.statementId,
        evalCtx.errors,
      );
    } catch (e) {
      // Use raw value as fallback for this prop, collect structured error
      evaluated[key] = value;
      const msg = e instanceof Error ? e.message : String(e);
      evalCtx.errors?.push({
        source: "runtime",
        code: "runtime-error",
        component: el.typeName,
        statementId: el.statementId,
        message: `Evaluating prop "${key}" on ${el.typeName} failed: ${msg}`,
        hint: `Check the expression used for prop "${key}"`,
      });
    }
  }

  return { ...el, props: evaluated };
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
