// ─────────────────────────────────────────────────────────────────────────────
// Schema-aware materialization — single-pass lowering
// ─────────────────────────────────────────────────────────────────────────────

import type { ASTNode } from "./ast";
import { isASTNode, isRuntimeExpr } from "./ast";
import { callsOf, isReservedCall, RESERVED_CALLS } from "./builtins";
import { isElementNode, type MaterializeCtx } from "./types";
import {
  buildParamsSignature,
  INVALID,
  mapCallArgs,
  nameArgs,
  pushValidationIssue,
  resolveInvalidValue,
  validateSchemaValue,
} from "./validation";

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
  // A `{steps: [...]}` literal is evaluated too, so data cannot pose as custom action steps
  if (Array.isArray(obj.steps)) return true;
  return Object.values(obj).some(containsDynamicValue);
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
  ctx.unreached?.delete(name);
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

/** Registry calls (functions and steps) and reserved calls stay AST for the runtime. */
function isRuntimeCall(name: string, ctx: MaterializeCtx): boolean {
  return callsOf(ctx.cat).has(name) || isReservedCall(name);
}

/** A runtime call keeps its AST; a registered non-lazy call also gets mappedProps. */
function materializeCall(
  node: ASTNode & { k: "Comp" },
  ctx: MaterializeCtx,
  materializeArg: (a: ASTNode) => ASTNode,
): ASTNode {
  const args = node.args.map(materializeArg);
  const def = callsOf(ctx.cat).get(node.name);
  if (!def || def.lazy) return { ...node, args };
  // Built-ins coerce their args, so only library calls are checked
  const mappedProps = def.builtin
    ? nameArgs(args, def.params)
    : mapCallArgs(node.name, args, def, ctx);
  if (mappedProps) return { ...node, args, mappedProps };
  // An invalid action step is an empty plan, a no-op
  return def.kind === "action"
    ? { k: "Comp", name: "Action", args: [{ k: "Arr", els: [] }] }
    : { k: "Null" };
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
  const def = callsOf(ctx.cat).get(node.name);
  if (def?.kind !== "function" || !def.lazy || node.args.length < 3) return null;
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
      // Built-ins, library functions, action steps, reserved calls: keep as AST
      if (isRuntimeCall(node.name, ctx)) {
        return materializeCall(node, ctx, (a) => materializeExprInternal(a, ctx, scopedRefs));
      }
      const recursedArgs = node.args.map((a) => materializeExprInternal(a, ctx, scopedRefs));
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
      pushValidationIssue(ctx, node.name, "", {
        code: "unknown-component",
        available: ctx.cat && [...ctx.cat.keys()],
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

      // Inline Query/Mutation (not from a statement-level declaration) → validation error
      if (isReservedCall(name)) {
        pushValidationIssue(ctx, name, "", { code: "inline-reserved" });
        return null;
      }

      // Built-ins, library functions and action steps → preserve as ASTNode for runtime
      if (isRuntimeCall(name, ctx)) {
        const lazy = materializeLazyBuiltin(node, ctx, new Set());
        if (lazy) return lazy;
        return materializeCall(node, ctx, (a) => materializeExpr(a, ctx));
      }

      const def = ctx.cat?.get(name);
      const props: Record<string, unknown> = {};

      if (def) {
        // Set when a REQUIRED prop holds invalid data with no default to fall
        // back on — the only case where invalidity reaches the component itself.
        let dropComponent = false;
        // Catalog component: map positional args → named props
        for (let i = 0; i < def.params.length && i < args.length; i++) {
          const param = def.params[i];
          const value = materializeValue(args[i], ctx);
          props[param.name] = value;
          if (param.schema === undefined) continue;
          // Single validation entry point: scalar leaf type/enum for simple
          // props, recursive key/type checks (with pruning) for nested shapes.
          let next = validateSchemaValue(value, param.schema, name, `/${param.name}`, ctx);
          if (next === INVALID) {
            // Invalid prop value (error already reported). Same resolution rule as
            // every nested edge; propagation here means dropping the component.
            next = resolveInvalidValue(param.required, param.defaultValue);
            if (next === INVALID) dropComponent = true;
            else if (next === undefined) delete props[param.name];
          }
          if (next !== INVALID && next !== undefined) props[param.name] = next;
        }

        // Report excess positional args (extra args are silently dropped)
        if (args.length > def.params.length) {
          pushValidationIssue(ctx, name, "", {
            code: "excess-args",
            declared: def.params.length,
            got: args.length,
          });
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
              pushValidationIssue(ctx, name, `/${p.name}`, {
                code: p.name in props ? "null-required" : "missing-required",
                signature: buildParamsSignature(name, def.params),
              });
            }
            return null;
          }
        }

        // A required prop with unsalvageable data (no default) drops the
        // component — its error was already reported during validation.
        if (dropComponent) return null;
      } else {
        // Unknown component: error and drop from tree
        pushValidationIssue(ctx, name, "", {
          code: "unknown-component",
          available: ctx.cat && [...ctx.cat.keys()],
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
