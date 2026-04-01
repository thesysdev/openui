// ─────────────────────────────────────────────────────────────────────────────
// AST evaluator — resolves AST nodes to runtime values.
// Framework-agnostic. No React imports.
// ─────────────────────────────────────────────────────────────────────────────

import type { ASTNode } from "../parser/ast";
import { isASTNode } from "../parser/ast";
import { ACTION_NAMES, ACTION_STEPS, BUILTINS, LAZY_BUILTINS, toNumber } from "../parser/builtins";
import type { ActionPlan, ActionStep, ElementNode } from "../parser/types";
import { isElementNode } from "../parser/types";
import { isReactiveSchema } from "../reactive";

/** Optional schema context for reactive-aware evaluation. */
export interface SchemaContext {
  /** Component library — used to look up reactive schemas per prop. */
  library: { components: Record<string, { props: { shape?: Record<string, unknown> } }> };
}

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
export function evaluate(
  node: ASTNode,
  context: EvaluationContext,
  schemaCtx?: SchemaContext,
): unknown {
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
        return evaluateLazyBuiltin(node.name, node.args, context, schemaCtx);
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
      // If parser already mapped args→props (via materializeExpr), use named props.
      // With schema context: emit ReactiveAssign for StateRef on reactive props.
      // Without schema context: preserve StateRef as AST for evaluate-tree to handle.
      if (node.mappedProps) {
        const def = schemaCtx?.library.components[node.name];
        const props: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(node.mappedProps)) {
          const propSchema = def?.props?.shape?.[key];
          if (val.k === "StateRef" && propSchema && isReactiveSchema(propSchema)) {
            // Reactive schema + StateRef → emit ReactiveAssign marker
            props[key] = {
              __reactive: "assign" as const,
              target: val.n,
              expr: { k: "StateRef" as const, n: "$value" },
            };
          } else if (val.k === "StateRef") {
            // Non-reactive StateRef or no schema context → preserve for evaluate-tree
            props[key] = schemaCtx ? context.getState(val.n) : val;
          } else {
            props[key] = evaluate(val, context, schemaCtx);
          }
        }
        const result: ElementNode = {
          type: "element",
          typeName: node.name,
          props,
          partial: false,
          hasDynamicProps: true,
        };
        // If we have schema context, recursively evaluate nested ElementNodes in props
        if (schemaCtx) {
          for (const [key, val] of Object.entries(props)) {
            if (isElementNode(val)) {
              props[key] = evaluateElementInline(val, context, schemaCtx);
            } else if (Array.isArray(val)) {
              props[key] = val.map((item) =>
                isElementNode(item) ? evaluateElementInline(item, context, schemaCtx) : item,
              );
            }
          }
        }
        return result;
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
 * Evaluate an ElementNode's props with schema awareness. Used by evaluate()
 * when schema context is available and a Comp produces an ElementNode that
 * needs its own props evaluated with reactive schema detection.
 */
function evaluateElementInline(
  el: ElementNode,
  context: EvaluationContext,
  schemaCtx: SchemaContext,
): ElementNode {
  if (el.hasDynamicProps === false) return el;
  const def = schemaCtx.library.components[el.typeName];
  const evaluated: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(el.props)) {
    const propSchema = def?.props?.shape?.[key];
    evaluated[key] = evaluatePropInline(value, context, schemaCtx, propSchema);
  }
  return { ...el, props: evaluated };
}

/**
 * Evaluate a single prop value with schema awareness. Handles AST nodes,
 * ReactiveAssign markers, nested ElementNodes, arrays, and ActionPlans.
 */
function evaluatePropInline(
  value: unknown,
  context: EvaluationContext,
  schemaCtx: SchemaContext,
  reactiveSchema?: unknown,
): unknown {
  if (value == null) return value;
  if (typeof value !== "object") return value;

  // AST node
  if (isASTNode(value)) {
    if (value.k === "StateRef" && reactiveSchema && isReactiveSchema(reactiveSchema)) {
      return {
        __reactive: "assign" as const,
        target: value.n,
        expr: { k: "StateRef" as const, n: "$value" },
      };
    }
    const result = evaluate(value, context, schemaCtx);
    if (isElementNode(result)) return evaluateElementInline(result, context, schemaCtx);
    if (Array.isArray(result)) {
      return result.map((item) =>
        isElementNode(item) ? evaluateElementInline(item, context, schemaCtx) : item,
      );
    }
    if (isReactiveAssign(result) && !(reactiveSchema && isReactiveSchema(reactiveSchema))) {
      return context.getState(result.target) ?? null;
    }
    return result;
  }

  // String on reactive schema → pass through (component's useStateField resolves it)
  if (typeof value === "string" && reactiveSchema && isReactiveSchema(reactiveSchema)) {
    return value;
  }

  // Array
  if (Array.isArray(value)) {
    return value.map((v) => evaluatePropInline(v, context, schemaCtx, reactiveSchema));
  }

  // ElementNode → recurse with schema
  if (isElementNode(value)) {
    return evaluateElementInline(value, context, schemaCtx);
  }

  // ActionPlan / ActionStep — preserve as-is
  const obj = value as Record<string, unknown>;
  if ("steps" in obj && Array.isArray(obj.steps)) return value;
  if ("type" in obj && "valueAST" in obj) return value;

  // Plain data object — recurse
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
      result[k] = evaluatePropInline(v, context, schemaCtx);
    }
    return result;
  }

  return value;
}

/**
 * Check if an AST node contains any Ref nodes (loop variables like `t` from Each).
 * These must be resolved eagerly because they won't exist in scope at click time.
 */
function containsRef(node: ASTNode): boolean {
  switch (node.k) {
    case "Ref":
      return true;
    case "Member":
      return isASTNode(node.obj) ? containsRef(node.obj as ASTNode) : false;
    case "Index":
      return (
        (isASTNode(node.obj) && containsRef(node.obj as ASTNode)) ||
        (isASTNode(node.index) && containsRef(node.index as ASTNode))
      );
    case "BinOp":
      return containsRef(node.left) || containsRef(node.right);
    case "UnaryOp":
      return containsRef(node.operand);
    case "Ternary":
      return containsRef(node.cond) || containsRef(node.then) || containsRef(node.else);
    case "Arr":
      return node.els.some(containsRef);
    case "Obj":
      return node.entries.some(([, v]) => containsRef(v));
    case "Comp":
      return node.args.some(containsRef);
    default:
      return false;
  }
}

/** Convert a resolved runtime value back to a literal AST node for deferred evaluation. */
function toLiteralAST(value: unknown): ASTNode {
  if (value === null || value === undefined) return { k: "Null" };
  if (typeof value === "string") return { k: "Str", v: value };
  if (typeof value === "number") return { k: "Num", v: value };
  if (typeof value === "boolean") return { k: "Bool", v: value };
  if (Array.isArray(value)) return { k: "Arr", els: value.map(toLiteralAST) };
  if (typeof value === "object") {
    return {
      k: "Obj",
      entries: Object.entries(value).map(([k, v]) => [k, toLiteralAST(v)] as [string, ASTNode]),
    };
  }
  return { k: "Null" };
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
      // Loop variables (e.g. t.id from Each) are pre-resolved by Each's substituteRef.
      if (args.length < 2) return null;
      const targetNode = args[0];
      if (targetNode.k !== "StateRef") return null;
      return { type: ACTION_STEPS.Set, target: targetNode.n, valueAST: args[1] };
    }
    case "Reset": {
      // Reset($var1, $var2, ...) → ActionStep { type: "reset", targets: [...] }
      // All args must be StateRef nodes. Restores to declared defaults at runtime.
      const targets = args
        .filter((a): a is ASTNode & { k: "StateRef" } => a.k === "StateRef")
        .map((a) => a.n);
      if (targets.length === 0) return null;
      return { type: ACTION_STEPS.Reset, targets };
    }
    default:
      return null;
  }
}

/**
 * Substitute all Ref(varName) nodes in an AST tree with a literal value.
 * This pre-resolves loop variables so deferred expressions (like Action steps)
 * don't lose scope when evaluated later at click time.
 */
function substituteRef(node: ASTNode, varName: string, value: unknown): ASTNode {
  switch (node.k) {
    case "Ref":
      return node.n === varName ? toLiteralAST(value) : node;
    case "Member": {
      // Member access on the loop var: t.id → resolve t, then access .id
      if (isASTNode(node.obj)) {
        const subObj = substituteRef(node.obj as ASTNode, varName, value);
        // If obj resolved to a literal, we can inline the member access result
        if (subObj.k === "Obj") {
          const entry = subObj.entries.find(([k]) => k === node.field);
          if (entry) return entry[1];
        }
        return { ...node, obj: subObj };
      }
      return node;
    }
    case "Index":
      return {
        ...node,
        obj: isASTNode(node.obj) ? substituteRef(node.obj as ASTNode, varName, value) : node.obj,
        index: isASTNode(node.index)
          ? substituteRef(node.index as ASTNode, varName, value)
          : node.index,
      };
    case "BinOp":
      return {
        ...node,
        left: substituteRef(node.left, varName, value),
        right: substituteRef(node.right, varName, value),
      };
    case "UnaryOp":
      return { ...node, operand: substituteRef(node.operand, varName, value) };
    case "Ternary":
      return {
        ...node,
        cond: substituteRef(node.cond, varName, value),
        then: substituteRef(node.then, varName, value),
        else: substituteRef(node.else, varName, value),
      };
    case "Arr":
      return { ...node, els: node.els.map((e) => substituteRef(e, varName, value)) };
    case "Obj":
      return {
        ...node,
        entries: node.entries.map(
          ([k, v]) => [k, substituteRef(v, varName, value)] as [string, ASTNode],
        ),
      };
    case "Comp": {
      const result = { ...node, args: node.args.map((a) => substituteRef(a, varName, value)) };
      // Also substitute in mappedProps (added by materializer for catalog components)
      if (node.mappedProps) {
        const subProps: Record<string, ASTNode> = {};
        for (const [k, v] of Object.entries(node.mappedProps)) {
          subProps[k] = substituteRef(v, varName, value);
        }
        (result as any).mappedProps = subProps;
      }
      return result;
    }
    case "Assign":
      return { ...node, value: substituteRef(node.value, varName, value) };
    default:
      return node;
  }
}

/**
 * Each(array, varName, template) — evaluate template once per array item.
 * varName is user-defined (e.g. `issue`, `ticket`) — no $ prefix collision.
 *
 * Before evaluation, substitutes all Ref(varName) in the template with the
 * current item's literal value. This ensures deferred expressions (like
 * Action/Set steps) capture concrete values instead of dangling loop refs.
 */
function evaluateLazyBuiltin(
  name: string,
  args: ASTNode[],
  context: EvaluationContext,
  schemaCtx?: SchemaContext,
): unknown {
  if (name === "Each") {
    if (args.length < 3) return [];
    const arr = evaluate(args[0], context);
    if (!Array.isArray(arr)) return [];

    const varName =
      args[1].k === "Ref" ? args[1].n : args[1].k === "Str" ? (args[1] as any).v : null;
    if (!varName) return [];
    const template = args[2];

    return arr.map((item, idx) => {
      // Pre-substitute loop variable refs with concrete values in the template AST.
      // This captures the item for deferred expressions (Action steps evaluated at click time).
      const substituted = substituteRef(template, varName, item);
      const childCtx: EvaluationContext = {
        ...context,
        resolveRef: (refName: string) => {
          if (refName === varName) return item;
          return context.resolveRef(refName);
        },
      };
      const result = evaluate(substituted, childCtx, schemaCtx);
      // If schema context is available and result is an ElementNode, evaluate its props
      if (schemaCtx && isElementNode(result)) {
        return evaluateElementInline(result as ElementNode, childCtx, schemaCtx);
      }
      return result;
    });
  }
  return null;
}
