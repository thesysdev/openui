// ─────────────────────────────────────────────────────────────────────────────
// Schema-aware materialization — single-pass lowering
// ─────────────────────────────────────────────────────────────────────────────

import type { ASTNode } from "./ast";
import { isASTNode, isRuntimeExpr, literalValue, toLiteralAST, walkAST } from "./ast";
import { getCallDefs, isReservedCall, RESERVED_CALLS } from "./builtins";
import {
  isElementNode,
  type CallDef,
  type ElementNode,
  type MaterializeCtx,
  type ParamDef,
  type ValidationError,
} from "./types";
import {
  buildParamsSignature,
  INVALID,
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
    return v.hasDynamicProps ?? Object.values(v.props).some(containsDynamicValue);
  }
  const obj = v as Record<string, unknown>;
  // A `{steps: [...]}` literal is evaluated too, so data cannot pose as custom action steps
  if (Array.isArray(obj.steps)) return true;
  return Object.values(obj).some(containsDynamicValue);
}

/**
 * Tag an element with the statement it came from. An element already tagged with another
 * statement is a shared memoized node reached through an alias (`b = a`): copy it.
 */
export function withStatementId(el: ElementNode, id: string): ElementNode {
  if (el.statementId === undefined || el.statementId === id) {
    el.statementId = id;
    return el;
  }
  return { ...el, statementId: id };
}

/** A ref read while materializing a statement; `rt` marks a Query/Mutation, kept as its AST. */
interface RefRead {
  ref: string;
  mode: "value" | "expr";
  value: unknown;
  rt?: true;
}

/** What a statement's materialization did, in order: its own errors and the refs it read. */
type StatementLog = (ValidationError | RefRead)[];

interface CachedStatement {
  ast: ASTNode;
  value: unknown;
  log: StatementLog;
}

/**
 * Keeps statement values across stream parser passes, so an unchanged statement gives the
 * same object on every chunk. A value is reused while its statement's AST object is the same
 * (the stream parser keeps completed statements), the pass has the same `partial`, and every
 * ref it read gives the same value again; reusing it replays its errors in order and its reads.
 * Not kept: a statement that hit an unresolved or cyclic ref, a statement still being written,
 * and anything that read one.
 */
export interface StatementReuse {
  /** Kept across passes, keyed by `${partial}:${mode}:${name}`. */
  entries: Map<string, unknown>;
  /** Statements still being written. */
  streaming: ReadonlySet<string>;
  /** Per pass: logs of the statements being materialized, innermost last; null while replaying. */
  frames: ({ log: StatementLog; mark: number } | null)[];
  /** Per pass: counts reads of statements still being written. */
  volatile: number;
  /** Per pass: whether an entry can be reused. */
  fresh: Map<string, boolean>;
}

export function createStatementReuse(
  entries: Map<string, unknown>,
  streaming: ReadonlySet<string>,
): StatementReuse {
  return { entries, streaming, frames: [], volatile: 0, fresh: new Map() };
}

/** The errors the frame's statement pushed itself since its last nested read. */
function flushErrors(frame: { log: StatementLog; mark: number }, ctx: MaterializeCtx): void {
  for (let i = frame.mark; i < ctx.errors.length; i++) frame.log.push(ctx.errors[i]!);
  frame.mark = ctx.errors.length;
}

function isFresh(key: string, name: string, ctx: MaterializeCtx, reuse: StatementReuse): boolean {
  const known = reuse.fresh.get(key);
  if (known !== undefined) return known;
  const entry = reuse.entries.get(key) as CachedStatement | undefined;
  let ok = !!entry && entry.ast === ctx.syms.get(name) && !reuse.streaming.has(name);
  for (let i = 0; ok && i < entry!.log.length; i++) {
    const read = entry!.log[i]!;
    if (!("ref" in read)) continue;
    if (reuse.streaming.has(read.ref)) ok = false;
    else if (read.rt) ok = ctx.syms.get(read.ref) === read.value;
    else {
      const memoKey = `${read.mode}:${read.ref}`;
      if (ctx.memo?.has(memoKey)) ok = ctx.memo.get(memoKey) === read.value;
      else {
        const depKey = key.slice(0, 2) + memoKey;
        ok =
          (reuse.entries.get(depKey) as CachedStatement | undefined)?.value === read.value &&
          isFresh(depKey, read.ref, ctx, reuse);
      }
    }
  }
  reuse.fresh.set(key, ok);
  return ok;
}

/**
 * Resolve a Ref node: inline from symbol table, detect cycles, emit RuntimeRef
 * for Query/Mutation declarations. Shared by materializeValue and materializeExpr.
 *
 * Results are memoized per pass so each statement materializes once (shared refs
 * are otherwise exponential). Skipped when the subtree hit an unresolved or cyclic
 * ref (context-dependent). Use-site validation copies on write, so a shared result is
 * never pruned in place. Errors inside a memoized statement are reported once.
 * With `ctx.reuse`, results are also kept across passes (see StatementReuse).
 */
function resolveRef(name: string, ctx: MaterializeCtx, mode: "value" | "expr"): unknown | ASTNode {
  if (ctx.visited.has(name) || !ctx.syms.has(name)) {
    ctx.unres.push(name);
    return mode === "expr" ? { k: "Ph", n: name } : null;
  }
  const target = ctx.syms.get(name)!;
  ctx.unreached?.delete(name);
  const reuse = ctx.reuse;
  const parent = reuse?.frames[reuse.frames.length - 1];
  if (reuse?.streaming.has(name)) reuse.volatile++;
  if (parent) flushErrors(parent, ctx);
  // Query/Mutation declarations → RuntimeRef (resolved at runtime by evaluator)
  if (target.k === "Comp" && isReservedCall(target.name)) {
    const refType =
      target.name === RESERVED_CALLS.Mutation ? ("mutation" as const) : ("query" as const);
    parent?.log.push({ ref: name, mode, value: target, rt: true });
    return { k: "RuntimeRef", n: name, refType };
  }
  const key = `${mode}:${name}`;
  const memo = (ctx.memo ??= new Map());
  let result: unknown;
  if (memo.has(key)) result = memo.get(key);
  else {
    const cacheKey = (ctx.partial ? "1:" : "0:") + key;
    const prevStatementId = ctx.currentStatementId;
    ctx.currentStatementId = name;
    ctx.visited.add(name);
    try {
      if (reuse && isFresh(cacheKey, name, ctx, reuse)) {
        const entry = reuse.entries.get(cacheKey) as CachedStatement;
        reuse.frames.push(null);
        try {
          for (const item of entry.log) {
            if ("ref" in item) resolveRef(item.ref, ctx, item.mode);
            else ctx.errors.push({ ...item });
          }
        } finally {
          reuse.frames.pop();
        }
        result = entry.value;
        memo.set(key, result);
      } else {
        const unresBefore = ctx.unres.length;
        const volatileBefore = reuse?.volatile;
        const frame = reuse && { log: [] as StatementLog, mark: ctx.errors.length };
        if (frame) reuse!.frames.push(frame);
        try {
          result = mode === "value" ? materializeValue(target, ctx) : materializeExpr(target, ctx);
        } finally {
          if (frame) reuse!.frames.pop();
        }
        if (mode === "value" && isElementNode(result)) result = withStatementId(result, name);
        if (ctx.unres.length === unresBefore) {
          memo.set(key, result);
          if (frame && reuse!.volatile === volatileBefore && !reuse!.streaming.has(name)) {
            flushErrors(frame, ctx);
            reuse!.entries.set(cacheKey, { ast: target, value: result, log: frame.log });
          }
        }
      }
    } finally {
      ctx.currentStatementId = prevStatementId;
      ctx.visited.delete(name);
    }
  }
  if (parent) {
    parent.mark = ctx.errors.length;
    parent.log.push({ ref: name, mode, value: result });
  }
  return result;
}

/** Registry calls (functions and steps) and reserved calls stay AST for the runtime. */
function isRuntimeCall(name: string, ctx: MaterializeCtx): boolean {
  return getCallDefs(ctx.cat).has(name) || isReservedCall(name);
}

// [Num 1, Ref x] with params [a, b] -> {a: Num 1, b: Ref x}; extra args dropped
export function nameArgs(args: ASTNode[], params: ParamDef[]): Record<string, ASTNode> {
  const named: Record<string, ASTNode> = {};
  for (let i = 0; i < params.length && i < args.length; i++) named[params[i]!.name] = args[i]!;
  return named;
}

// @Percent("x", 4) -> type-mismatch at parse time, call becomes null
export function mapCallArgs(
  name: string,
  args: ASTNode[],
  def: CallDef,
  ctx: MaterializeCtx,
): Record<string, ASTNode> | null {
  const { params } = def;
  if (args.length > params.length) {
    pushValidationIssue(ctx, name, "", {
      code: "excess-args",
      declared: params.length,
      got: args.length,
    });
  }
  const mapped = nameArgs(args, params);
  let invalid = false;
  const errorsBefore = ctx.errors.length;
  for (const p of params) {
    const arg = mapped[p.name];
    const lit = arg ? literalValue(arg) : { v: undefined };
    if (!lit) continue;
    if (lit.v == null) {
      if (!p.required || p.defaultValue !== undefined) continue;
      pushValidationIssue(ctx, name, `/${p.name}`, {
        code: arg ? "null-required" : "missing-required",
        signature: buildParamsSignature(name, params),
      });
      invalid = true;
      continue;
    }
    let next = validateSchemaValue(lit.v, p.schema, name, `/${p.name}`, ctx);
    if (next === INVALID) next = resolveInvalidValue(p.required, p.defaultValue);
    if (next === INVALID) invalid = true;
    else if (next === undefined) delete mapped[p.name];
    else if (next !== lit.v) mapped[p.name] = toLiteralAST(next);
  }
  // An action never runs with a value the model did not write:
  // @ExportFile("report", "xlsx") is a no-op, not an export with the "csv" default
  if (def.kind === "action" && ctx.errors.length > errorsBefore) invalid = true;
  return invalid ? null : mapped;
}

// @Percent(3, total) -> mappedProps {part: Num 3, total: <total AST>}
function materializeCall(
  node: ASTNode & { k: "Comp" },
  ctx: MaterializeCtx,
  materializeArg: (a: ASTNode) => ASTNode,
): ASTNode {
  const args = node.args.map(materializeArg);
  const def = getCallDefs(ctx.cat).get(node.name);
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

// Query("s", {n: @Count(rows)}): names @Count's args in place.
// Literal library args are checked like props; an invalid call keeps raw names and is null at runtime.
export function nameRawCallArgs(args: ASTNode[], ctx: MaterializeCtx, statementId: string): void {
  const prevStatementId = ctx.currentStatementId;
  ctx.currentStatementId = statementId;
  const seen = new Set<ASTNode>(); // walkAST visits nested calls through args and mappedProps
  for (const arg of args) {
    walkAST(arg, (node) => {
      if (node.k !== "Comp" || seen.has(node)) return;
      seen.add(node);
      const def = getCallDefs(ctx.cat).get(node.name);
      if (!def || def.lazy) return;
      const checked = def.builtin ? null : mapCallArgs(node.name, node.args, def, ctx);
      node.mappedProps = checked ?? nameArgs(node.args, def.params);
    });
  }
  ctx.currentStatementId = prevStatementId;
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
  const def = getCallDefs(ctx.cat).get(node.name);
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
      if (node.fn && !isRuntimeCall(node.name, ctx)) {
        pushValidationIssue(ctx, node.name, "", { code: "unknown-function" });
        return { k: "Null" };
      }
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

      if (node.fn && !isRuntimeCall(name, ctx)) {
        pushValidationIssue(ctx, name, "", { code: "unknown-function" });
        return null;
      }

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
