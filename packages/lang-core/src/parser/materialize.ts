// ─────────────────────────────────────────────────────────────────────────────
// Schema-aware materialization — single-pass lowering
// ─────────────────────────────────────────────────────────────────────────────

import type { ASTNode } from "./ast";
import { isASTNode, isRuntimeExpr } from "./ast";
import { isBuiltin, isReservedCall, LAZY_BUILTINS, RESERVED_CALLS } from "./builtins";
import { isElementNode, type ParamMap, type ValidationError } from "./types";

/**
 * Recursively check if a prop value contains any AST nodes that need runtime
 * evaluation. Walks into arrays, ElementNode children, and plain objects.
 */
export function containsDynamicValue(v: unknown): boolean {
  if (v == null || typeof v !== "object") return false;
  if (isASTNode(v)) return true;
  if (Array.isArray(v)) return v.some(containsDynamicValue);
  if (isElementNode(v)) {
    return Object.values(v.props).some(containsDynamicValue);
  }
  const obj = v as Record<string, unknown>;
  return Object.values(obj).some(containsDynamicValue);
}

export interface MaterializeCtx {
  syms: Map<string, ASTNode>;
  cat: ParamMap | undefined;
  errors: ValidationError[];
  unres: string[];
  visited: Set<string>;
  partial: boolean;
  /** Tracks which statement is currently being materialized (for error attribution). */
  currentStatementId?: string;
}

/**
 * Resolve a Ref node: inline from symbol table, detect cycles, emit RuntimeRef
 * for Query/Mutation declarations. Shared by materializeValue and materializeExpr.
 */
function resolveRef(name: string, ctx: MaterializeCtx, mode: "value" | "expr"): unknown | ASTNode {
  if (ctx.visited.has(name)) {
    ctx.unres.push(name);
    return mode === "expr" ? { k: "Ph", n: name } : null;
  }
  if (!ctx.syms.has(name)) {
    ctx.unres.push(name);
    return mode === "expr" ? { k: "Ph", n: name } : null;
  }
  const target = ctx.syms.get(name)!;
  // Query/Mutation declarations → RuntimeRef (resolved at runtime by evaluator)
  if (target.k === "Comp" && isReservedCall(target.name)) {
    const refType =
      target.name === RESERVED_CALLS.Mutation ? ("mutation" as const) : ("query" as const);
    return { k: "RuntimeRef", n: name, refType };
  }
  ctx.visited.add(name);
  const prevStatementId = ctx.currentStatementId;
  ctx.currentStatementId = name;
  try {
    const result = mode === "value" ? materializeValue(target, ctx) : materializeExpr(target, ctx);
    // Tag ElementNode with its source statement name
    if (mode === "value" && isElementNode(result)) {
      result.statementId = name;
    }
    return result;
  } finally {
    ctx.currentStatementId = prevStatementId;
    ctx.visited.delete(name);
  }
}

/**
 * If node is a lazy builtin like Each(arr, varName, template), temporarily
 * scope the iterator variable during materialization so template refs resolve.
 * Returns the materialized Comp node, or null if not a lazy builtin.
 */
function materializeLazyBuiltin(
  node: ASTNode & { k: "Comp" },
  ctx: MaterializeCtx,
  scopedRefs: ReadonlySet<string>,
): ASTNode | null {
  if (!LAZY_BUILTINS.has(node.name) || node.args.length < 3) return null;
  const varArg = node.args[1];
  const varName = varArg.k === "Ref" ? varArg.n : varArg.k === "Str" ? varArg.v : null;
  if (!varName) return null;

  const nextScopedRefs = new Set(scopedRefs);
  nextScopedRefs.add(varName);
  // Skip args[1] (the iterator declaration) but preserve scoped refs elsewhere.
  const recursedArgs = node.args.map((a, i) =>
    i === 1 ? a : materializeExprInternal(a, ctx, nextScopedRefs),
  );
  return { ...node, args: recursedArgs };
}

function materializeExprInternal(
  node: ASTNode,
  ctx: MaterializeCtx,
  scopedRefs: ReadonlySet<string>,
): ASTNode {
  switch (node.k) {
    case "Ref":
      return scopedRefs.has(node.n) ? node : (resolveRef(node.n, ctx, "expr") as ASTNode);

    case "Ph":
      return node;

    case "Comp": {
      const lazy = materializeLazyBuiltin(node, ctx, scopedRefs);
      if (lazy) return lazy;
      const recursedArgs = node.args.map((a) => materializeExprInternal(a, ctx, scopedRefs));
      // Builtins, reserved calls, and action calls: recurse args, keep as-is
      if (isBuiltin(node.name) || isReservedCall(node.name)) {
        return { ...node, args: recursedArgs };
      }
      // Catalog component: add mappedProps for the evaluator
      const def = ctx.cat?.get(node.name);
      if (def) {
        const mappedProps: Record<string, ASTNode> = {};
        for (let i = 0; i < def.params.length && i < recursedArgs.length; i++) {
          mappedProps[def.params[i].name] = recursedArgs[i];
        }
        return { ...node, args: recursedArgs, mappedProps };
      }
      // Unknown component in expression: push error (same as value path)
      ctx.errors.push({
        code: "unknown-component",
        component: node.name,
        path: "",
        message: `Unknown component "${node.name}" — not found in catalog or builtins`,
        statementId: ctx.currentStatementId,
      });
      return { ...node, args: recursedArgs };
    }

    case "Arr":
      return { ...node, els: node.els.map((e) => materializeExprInternal(e, ctx, scopedRefs)) };
    case "Obj":
      return {
        ...node,
        entries: node.entries.map(
          ([k, v]) => [k, materializeExprInternal(v, ctx, scopedRefs)] as [string, ASTNode],
        ),
      };
    case "BinOp":
      return {
        ...node,
        left: materializeExprInternal(node.left, ctx, scopedRefs),
        right: materializeExprInternal(node.right, ctx, scopedRefs),
      };
    case "UnaryOp":
      return { ...node, operand: materializeExprInternal(node.operand, ctx, scopedRefs) };
    case "Ternary":
      return {
        ...node,
        cond: materializeExprInternal(node.cond, ctx, scopedRefs),
        then: materializeExprInternal(node.then, ctx, scopedRefs),
        else: materializeExprInternal(node.else, ctx, scopedRefs),
      };
    case "Member":
      return { ...node, obj: materializeExprInternal(node.obj, ctx, scopedRefs) };
    case "Index":
      return {
        ...node,
        obj: materializeExprInternal(node.obj, ctx, scopedRefs),
        index: materializeExprInternal(node.index, ctx, scopedRefs),
      };
    case "Assign":
      return { ...node, value: materializeExprInternal(node.value, ctx, scopedRefs) };

    // Literals, StateRef, RuntimeRef — pass through unchanged
    default:
      return node;
  }
}

/**
 * Normalize an AST node for use inside runtime expressions.
 * Resolves Refs, adds mappedProps to catalog Comp nodes.
 * Returns ASTNode — structure preserved for runtime evaluation by the evaluator.
 */
export function materializeExpr(node: ASTNode, ctx: MaterializeCtx): ASTNode {
  return materializeExprInternal(node, ctx, new Set());
}

/**
 * Schema-aware materialization: resolves refs, normalizes catalog component args
 * to named props, validates required props, applies defaults, converts literals
 * to plain values, and preserves runtime expressions as AST nodes — all in a
 * single recursive traversal.
 *
 * Returns:
 *   - ElementNode for catalog/unknown components
 *   - ASTNode for builtins and runtime expression nodes
 *   - Plain values for literals, arrays, objects
 *   - null for placeholders
 */
export function materializeValue(node: ASTNode, ctx: MaterializeCtx): unknown {
  switch (node.k) {
    // ── Ref resolution ───────────────────────────────────────────────────
    case "Ref":
      return resolveRef(node.n, ctx, "value");

    // ── Literals → plain values ──────────────────────────────────────────
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

    // ── Collections ──────────────────────────────────────────────────────
    case "Arr": {
      const items: unknown[] = [];
      for (const e of node.els) {
        // Drop unresolved placeholders from arrays
        if (e.k === "Ph") continue;
        const value = materializeValue(e, ctx);
        // Drop null entries from component/ref resolution (incomplete props, unresolved refs, unknown components)
        if (value === null && (e.k === "Comp" || e.k === "Ref")) continue;
        items.push(value);
      }
      return items;
    }
    case "Obj": {
      const o: Record<string, unknown> = {};
      for (const [k, v] of node.entries) o[k] = materializeValue(v, ctx);
      return o;
    }

    // ── Component nodes ──────────────────────────────────────────────────
    case "Comp": {
      const { name, args } = node;

      // Builtins (Sum, Count, Filter, Action, etc.) → preserve as ASTNode for runtime
      if (isBuiltin(name)) {
        const lazy = materializeLazyBuiltin(node, ctx, new Set());
        if (lazy) return lazy;
        return { ...node, args: args.map((a) => materializeExpr(a, ctx)) };
      }

      // Inline Query/Mutation (not from a statement-level declaration) → validation error
      if (isReservedCall(name)) {
        ctx.errors.push({
          code: "inline-reserved",
          component: name,
          path: "",
          message: `${name}() must be declared as a top-level statement, not used inline as a value`,
          statementId: ctx.currentStatementId,
        });
        return null;
      }

      const def = ctx.cat?.get(name);
      const props: Record<string, unknown> = {};

      if (def) {
        // Catalog component: map positional args → named props
        for (let i = 0; i < def.params.length && i < args.length; i++) {
          props[def.params[i].name] = materializeValue(args[i], ctx);
        }

        // Validate required props — try defaultValue first before dropping
        const missingRequired = def.params.filter(
          (p) => p.required && (!(p.name in props) || props[p.name] === null),
        );
        if (missingRequired.length) {
          const stillInvalid = missingRequired.filter((p) => {
            if (p.defaultValue !== undefined) {
              props[p.name] = p.defaultValue;
              return false;
            }
            return true;
          });
          if (stillInvalid.length) {
            for (const p of stillInvalid) {
              const isNull = p.name in props;
              ctx.errors.push({
                code: isNull ? "null-required" : "missing-required",
                component: name,
                path: `/${p.name}`,
                message: isNull
                  ? `required field "${p.name}" cannot be null`
                  : `missing required field "${p.name}"`,
                statementId: ctx.currentStatementId,
              });
            }
            return null;
          }
        }
      } else if (!isBuiltin(name) && !isReservedCall(name)) {
        // Unknown component: error and drop from tree
        ctx.errors.push({
          code: "unknown-component",
          component: name,
          path: "",
          message: `Unknown component "${name}" — not found in catalog or builtins`,
          statementId: ctx.currentStatementId,
        });
        return null;
      }

      const hasDynamicProps = Object.values(props).some((v) => containsDynamicValue(v));
      return { type: "element", typeName: name, props, partial: ctx.partial, hasDynamicProps };
    }

    // ── Runtime expression nodes → preserve as ASTNode, normalize children ─
    default: {
      if (isRuntimeExpr(node)) {
        return materializeExpr(node, ctx);
      }
      // Unreachable for well-formed AST, but preserve the value defensively.
      return node;
    }
  }
}
