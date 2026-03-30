// ─────────────────────────────────────────────────────────────────────────────
// AST evaluator — resolves AST nodes to runtime values.
// Framework-agnostic. No React imports.
// ─────────────────────────────────────────────────────────────────────────────

import type { ASTNode } from "../parser/ast";
import { ACTION_NAMES, ACTION_STEPS, BUILTINS, LAZY_BUILTINS, toNumber } from "../parser/builtins";
import type { ActionPlan, ActionStep } from "../parser/types";

export interface EvaluationContext {
  /** Read $variable from the store */
  getState(name: string): unknown;
  /** Resolve a reference to another declaration's evaluated value */
  resolveRef(name: string): unknown;
  /** Extra scope for $value injection during reactive prop evaluation */
  extraScope?: Record<string, unknown>;
}

export interface ReactiveAssign {
  __reactive: "assign";
  target: string;
  expr: ASTNode;
}

export function isReactiveAssign(value: unknown): value is ReactiveAssign {
  return typeof value === "object" && value !== null && (value as any).__reactive === "assign";
}

/**
 * Evaluate an AST node to a runtime value.
 */
export function evaluate(node: ASTNode, context: EvaluationContext): unknown {
  switch (node.k) {
    // ── Literals ──────────────────────────────────────────────────────────
    case "Str":
      return node.v;
    case "Num":
      return node.v;
    case "Bool":
      return node.v;
    case "Null":
      return null;
    case "Ph":
      return null;

    // ── State references ──────────────────────────────────────────────────
    case "StateRef":
      return context.extraScope?.[node.n] ?? context.getState(node.n);

    // ── References ────────────────────────────────────────────────────────
    case "Ref":
    case "RuntimeRef":
      return context.resolveRef(node.n);

    // ── Collections ───────────────────────────────────────────────────────
    case "Arr":
      return node.els.map((el) => evaluate(el, context));
    case "Obj":
      return Object.fromEntries(node.entries.map(([k, v]) => [k, evaluate(v, context)]));

    // ── Component ─────────────────────────────────────────────────────────
    case "Comp": {
      // Lazy builtins — control their own evaluation
      if (LAZY_BUILTINS.has(node.name)) {
        return evaluateLazyBuiltin(node.name, node.args, context);
      }
      // Check shared builtin registry first
      const builtin = BUILTINS[node.name];
      if (builtin) {
        const args = node.args.map((a) => evaluate(a, context));
        return builtin.fn(...args);
      }
      // Action calls → evaluate to ActionPlan/ActionStep
      if (ACTION_NAMES.has(node.name)) {
        return evaluateActionCall(node.name, node.args, context);
      }
      // If parser already mapped args→props (via materializeExpr), use named props
      if (node.mappedProps) {
        const props: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(node.mappedProps)) {
          props[key] = evaluate(val, context);
        }
        return { type: "element", typeName: node.name, props, partial: false };
      }
      // After materializeValue, all catalog/unknown components are lowered to
      // ElementNode at parse time. Only builtins and mappedProps Comp nodes
      // reach here. If we somehow get an unmapped Comp, warn and return null.
      console.warn(`[openui] Unexpected unmapped Comp node: ${node.name}`);
      return null;
    }

    // ── Binary operators ──────────────────────────────────────────────────
    case "BinOp": {
      // Short-circuit operators evaluate lazily
      if (node.op === "&&") {
        const left = evaluate(node.left, context);
        return left ? evaluate(node.right, context) : left;
      }
      if (node.op === "||") {
        const left = evaluate(node.left, context);
        return left ? left : evaluate(node.right, context);
      }

      const left = evaluate(node.left, context);
      const right = evaluate(node.right, context);

      switch (node.op) {
        case "+":
          if (typeof left === "string" || typeof right === "string") {
            // Treat null/undefined as "" for string concat to avoid "textnull"
            return String(left ?? "") + String(right ?? "");
          }
          return toNumber(left) + toNumber(right);
        case "-":
          return toNumber(left) - toNumber(right);
        case "*":
          return toNumber(left) * toNumber(right);
        case "/":
          // DSL design choice: division by zero returns 0 instead of JavaScript's Infinity/NaN.
          return toNumber(right) === 0 ? 0 : toNumber(left) / toNumber(right);
        case "%":
          return toNumber(right) === 0 ? 0 : toNumber(left) % toNumber(right);
        case "==":
          // Use loose equality so that e.g. 5 == "5" is true,
          // consistent with the toNumber coercion used by comparison operators.
          // eslint-disable-next-line eqeqeq
          return left == right;
        case "!=":
          // eslint-disable-next-line eqeqeq
          return left != right;
        case ">":
          return toNumber(left) > toNumber(right);
        case "<":
          return toNumber(left) < toNumber(right);
        case ">=":
          return toNumber(left) >= toNumber(right);
        case "<=":
          return toNumber(left) <= toNumber(right);
        default:
          return null;
      }
    }

    // ── Unary operators ───────────────────────────────────────────────────
    case "UnaryOp":
      if (node.op === "!") {
        return !evaluate(node.operand, context);
      }
      if (node.op === "-") {
        return -toNumber(evaluate(node.operand, context));
      }
      return null;

    // ── Ternary ───────────────────────────────────────────────────────────
    case "Ternary": {
      const cond = evaluate(node.cond, context);
      return cond ? evaluate(node.then, context) : evaluate(node.else, context);
    }

    // ── Member access ─────────────────────────────────────────────────────
    case "Member": {
      const obj = evaluate(node.obj, context) as any;
      if (obj == null) return null;
      // Array pluck: if obj is an array, extract field from every element
      if (Array.isArray(obj)) {
        if (node.field === "length") return obj.length;
        return obj.map((item: any) => item?.[node.field] ?? null);
      }
      return obj[node.field];
    }

    // ── Index access ──────────────────────────────────────────────────────
    case "Index": {
      const obj = evaluate(node.obj, context) as any;
      const idx = evaluate(node.index, context);
      if (obj == null || idx == null) return null;
      if (Array.isArray(obj)) {
        return obj[toNumber(idx)];
      }
      return obj[String(idx)];
    }

    // ── Assignment ────────────────────────────────────────────────────────
    case "Assign":
      return {
        __reactive: "assign" as const,
        target: node.target,
        expr: node.value,
      };
  }
}

/**
 * Strip a ReactiveAssign to its current value in a non-reactive context.
 * When transport args or non-reactive props contain a ReactiveAssign, this
 * resolves it to the current state value (or null if getState is unavailable).
 */
export function stripReactiveAssign(value: unknown, context: EvaluationContext): unknown {
  if (!isReactiveAssign(value)) return value;
  return context.getState(value.target) ?? null;
}

/**
 * Evaluate Action/Run/ToAssistant/OpenUrl Comp nodes into ActionPlan/ActionStep values.
 */
function evaluateActionCall(
  name: string,
  args: ASTNode[],
  context: EvaluationContext,
): ActionPlan | ActionStep | null {
  switch (name) {
    case "Action": {
      // Action([step1, step2, ...]) → ActionPlan
      const stepsArg = args.length > 0 ? evaluate(args[0], context) : [];
      const rawSteps = Array.isArray(stepsArg) ? stepsArg : [];
      const steps: ActionStep[] = rawSteps.filter(
        (s): s is ActionStep => s != null && typeof s === "object" && "type" in s,
      );
      return { steps };
    }
    case "Run": {
      // Run(runtimeRef) → ActionStep { type: "run", statementId, refType }
      if (args.length === 0) return null;
      const refNode = args[0];
      if (refNode.k === "RuntimeRef") {
        return { type: ACTION_STEPS.Run, statementId: refNode.n, refType: refNode.refType };
      }
      // Unresolved Ref — skip (filtered out by Action's step array)
      return null;
    }
    case "ToAssistant": {
      // ToAssistant("message") or ToAssistant("message", "context")
      const message = args.length > 0 ? String(evaluate(args[0], context) ?? "") : "";
      const ctx = args.length > 1 ? String(evaluate(args[1], context) ?? "") : undefined;
      return { type: ACTION_STEPS.ToAssistant, message, context: ctx };
    }
    case "OpenUrl": {
      // OpenUrl("url")
      const url = args.length > 0 ? String(evaluate(args[0], context) ?? "") : "";
      return { type: ACTION_STEPS.OpenUrl, url };
    }
    case "Set": {
      // Set($varName, value) → ActionStep { type: "set", target, valueAST }
      // First arg must be a StateRef (the $variable), second arg is the value expression.
      // valueAST is preserved as-is and evaluated at click time by triggerAction.
      if (args.length < 2) return null;
      const targetNode = args[0];
      if (targetNode.k !== "StateRef") return null;
      return { type: ACTION_STEPS.Set, target: targetNode.n, valueAST: args[1] };
    }
    default:
      return null;
  }
}

/**
 * Each(array, varName, template) — evaluate template once per array item.
 * varName is user-defined (e.g. `issue`, `ticket`) — no $ prefix collision.
 */
function evaluateLazyBuiltin(name: string, args: ASTNode[], context: EvaluationContext): unknown {
  if (name === "Each") {
    if (args.length < 3) return [];
    const arr = evaluate(args[0], context);
    if (!Array.isArray(arr)) return [];

    const varName =
      args[1].k === "Ref" ? args[1].n : args[1].k === "Str" ? (args[1] as any).v : null;
    if (!varName) return [];
    const template = args[2];

    // Iterator variable is unprefixed (no $) — resolved via resolveRef, not extraScope
    return arr.map((item) => {
      const childCtx: EvaluationContext = {
        ...context,
        resolveRef: (refName: string) => {
          if (refName === varName) return item;
          return context.resolveRef(refName);
        },
      };
      return evaluate(template, childCtx);
    });
  }
  return null;
}
