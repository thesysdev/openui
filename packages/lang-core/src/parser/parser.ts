import {
  captureParserParseException,
  captureParserParseResult,
  prepareParserParseTelemetry,
} from "../telemetry/runtime";
import type { ASTNode, Statement } from "./ast";
import { isASTNode, walkAST } from "./ast";
<<<<<<< Updated upstream
import { ACTION_DEFS, BUILTIN_CALLS, isBuiltin, isReservedCall, RESERVED_CALLS } from "./builtins";
import { parseExpression } from "./expressions";
import { tokenize } from "./lexer";
import { materializeValue, nameRawCallArgs } from "./materialize";
import { autoClose, split, type RawStmt } from "./statements";
=======
import { isBuiltin, isReservedCall, RESERVED_CALLS } from "./builtins";
import { parseExpression } from "./expressions";
import { materializeValue, resolveComponentName } from "./materialize";
import { autoClose, scanStatements, splitStatementText, type RawStmt } from "./statements";
>>>>>>> Stashed changes
import { T } from "./tokens";
import {
  isElementNode,
  type ElementNode,
<<<<<<< Updated upstream
  type JSONSchemaDef,
=======
>>>>>>> Stashed changes
  type LibraryJSONSchema,
  type MaterializeCtx,
  type MutationStatementInfo,
  type ParamDef,
  type ParamMap,
  type ParseResult,
  type QueryStatementInfo,
  type ValidationError,
} from "./types";
import { getSchemaDefaultValue, pushValidationIssue } from "./validation";

// ─────────────────────────────────────────────────────────────────────────────
// Result building
// ─────────────────────────────────────────────────────────────────────────────

function emptyResult(incomplete = true): ParseResult {
  return {
    root: null,
    meta: {
      incomplete,
      unresolved: [],
      orphaned: [],
      statementCount: 0,
      errors: [],
    },
    stateDeclarations: {},
    queryStatements: [],
    mutationStatements: [],
  };
}

/**
 * Walk an AST node to collect all StateRef ($variable) names referenced
 * within. Used at parse time to pre-compute per-query state dependencies.
 */
export function collectQueryDeps(node: unknown): string[] {
  if (!isASTNode(node)) return [];
  const refs = new Set<string>();
  walkAST(node, (current) => {
    if (current.k === "StateRef") refs.add(current.n);
  });
  return [...refs];
}

/**
 * Classify a raw statement + parsed expression into a typed Statement.
 * Determined at parse time from token type + expression shape.
 */
function classifyStatement(raw: RawStmt, expr: ASTNode): Statement {
  // Query(...) → query declaration — check BEFORE $var to handle `$foo = Query(...)` correctly
  if (expr.k === "Comp" && expr.name === RESERVED_CALLS.Query) {
    const deps = collectQueryDeps(expr.args[1]);
    return {
      kind: "query",
      id: raw.id,
      call: { callee: RESERVED_CALLS.Query, args: expr.args },
      expr,
      deps: deps.length > 0 ? deps : undefined,
    };
  }
  // Mutation(...) → mutation declaration
  if (expr.k === "Comp" && expr.name === RESERVED_CALLS.Mutation) {
    return {
      kind: "mutation",
      id: raw.id,
      call: { callee: RESERVED_CALLS.Mutation, args: expr.args },
      expr,
    };
  }
  // $variables → state declaration
  if (raw.idTokenType === T.StateVar) {
    return { kind: "state", id: raw.id, init: expr };
  }
  // Everything else → value declaration
  return { kind: "value", id: raw.id, expr };
}

/**
 * Extract typed statements from the symbol table.
 * State defaults are materialized to plain values (no raw AST in output).
 */
/** A `$name` at the very end of streamed text, which may still be growing (`$d` of `$dishes`). */
interface PartialRef {
  name: string;
  stmts: ReadonlySet<Statement>;
}

function extractStatements(
  stmts: Statement[],
  ctx: MaterializeCtx,
  partialRef?: PartialRef,
): {
  stateDeclarations: Record<string, unknown>;
  queryStatements: QueryStatementInfo[];
  mutationStatements: MutationStatementInfo[];
} {
  const stateDeclarations: Record<string, unknown> = {};
  const queryStatements: QueryStatementInfo[] = [];
  const mutationStatements: MutationStatementInfo[] = [];

  for (const stmt of stmts) {
    switch (stmt.kind) {
      case "state":
        stateDeclarations[stmt.id] = materializeValue(stmt.init, ctx);
        break;
      case "query":
        nameRawCallArgs(stmt.call.args, ctx, stmt.id);
        queryStatements.push({
          statementId: stmt.id,
          toolAST: stmt.call.args[0] ?? null,
          argsAST: stmt.call.args[1] ?? null,
          defaultsAST: stmt.call.args[2] ?? null,
          refreshAST: stmt.call.args[3] ?? null,
          deps: stmt.deps,
          complete: true,
        });
        break;
      case "mutation":
        nameRawCallArgs(stmt.call.args, ctx, stmt.id);
        mutationStatements.push({
          statementId: stmt.id,
          toolAST: stmt.call.args[0] ?? null,
          argsAST: stmt.call.args[1] ?? null,
        });
        break;
    }
  }

  // Auto-declare: any $var referenced in code but not explicitly declared → null default.
  // collectQueryDeps already walks AST for StateRef nodes — reuse it here.
  for (const stmt of stmts) {
    const nodes =
      stmt.kind === "state"
        ? [stmt.init]
        : stmt.kind === "value"
          ? [stmt.expr]
          : stmt.kind === "query" || stmt.kind === "mutation"
            ? stmt.call.args
            : [];
    for (const node of nodes) {
      for (const dep of collectQueryDeps(node)) {
        if (dep === partialRef?.name && partialRef.stmts.has(stmt)) continue;
        if (!(dep in stateDeclarations)) {
          stateDeclarations[dep] = null;
        }
      }
    }
  }

  return { stateDeclarations, queryStatements, mutationStatements };
}

const DEFAULT_ROOT_STATEMENT_ID = "root";

<<<<<<< Updated upstream
/** A call to a library component: not an `@` function, built-in, Query or Mutation. */
function isComponentCall(node: ASTNode | undefined): node is Extract<ASTNode, { k: "Comp" }> {
  return node?.k === "Comp" && !node.fn && !isBuiltin(node.name) && !isReservedCall(node.name);
}

/** Entry: `root`, else the first statement that calls the root component. */
function pickEntry(
  stmtMap: Map<string, Statement>,
  rootName?: string,
): { id: string; fallback: boolean } | null {
  if (stmtMap.has(DEFAULT_ROOT_STATEMENT_ID))
    return { id: DEFAULT_ROOT_STATEMENT_ID, fallback: false };
  for (const stmt of stmtMap.values()) {
    if (stmt.kind === "value" && isComponentCall(stmt.expr) && stmt.expr.name === rootName)
      return { id: stmt.id, fallback: true };
=======
function isComponentStatement(
  stmt: Statement,
): stmt is Extract<Statement, { kind: "value" }> & { expr: Extract<ASTNode, { k: "Comp" }> } {
  return (
    stmt.kind === "value" &&
    stmt.expr.k === "Comp" &&
    !stmt.expr.fn &&
    !isBuiltin(stmt.expr.name) &&
    !isReservedCall(stmt.expr.name)
  );
}

/**
 * Pick the entry statement (spec section 2.2): the statement named `root`,
 * else the first statement when it calls the library's root component
 * (`fallback`, reported as a non-fatal no-root at stream end), else none.
 */
function pickEntry(
  stmtMap: Map<string, Statement>,
  firstId: string,
  cat: ParamMap | undefined,
  rootName?: string,
): { id: string; fallback: boolean } | null {
  if (stmtMap.has(DEFAULT_ROOT_STATEMENT_ID)) {
    return { id: DEFAULT_ROOT_STATEMENT_ID, fallback: false };
  }
  const first = stmtMap.get(firstId);
  if (
    rootName &&
    first &&
    isComponentStatement(first) &&
    resolveComponentName(cat, first.expr.name) === rootName
  ) {
    return { id: firstId, fallback: true };
>>>>>>> Stashed changes
  }
  return null;
}

<<<<<<< Updated upstream
/** Follow refs to the entry's value; a component call that did not render was dropped by validation. */
function resolvesToComponentCall(node: ASTNode | undefined, syms: Map<string, ASTNode>): boolean {
=======
/**
 * True when `node` is a component call, directly or through references. Such an
 * entry that did not render was dropped by validation, which already reported why.
 */
function isComponentCall(node: ASTNode | undefined, syms: Map<string, ASTNode>): boolean {
>>>>>>> Stashed changes
  const seen = new Set<string>();
  while (node?.k === "Ref" && !seen.has(node.n)) {
    seen.add(node.n);
    node = syms.get(node.n);
  }
<<<<<<< Updated upstream
  return isComponentCall(node);
=======
  return node?.k === "Comp" && !node.fn && !isBuiltin(node.name) && !isReservedCall(node.name);
>>>>>>> Stashed changes
}

/** True when a runtime expression can produce a component, e.g. `$t ? A : B`. */
function containsComponent(node: ASTNode): boolean {
  let found = false;
  walkAST(node, (current) => {
<<<<<<< Updated upstream
    if (isComponentCall(current)) found = true;
=======
    if (
      current.k === "Comp" &&
      !current.fn &&
      !isBuiltin(current.name) &&
      !isReservedCall(current.name)
    ) {
      found = true;
    }
>>>>>>> Stashed changes
  });
  return found;
}

function buildResult(
  stmtMap: Map<string, Statement>,
<<<<<<< Updated upstream
  typedStmts: Statement[],
=======
  firstId: string,
>>>>>>> Stashed changes
  wasIncomplete: boolean,
  cat: ParamMap | undefined,
<<<<<<< Updated upstream
  rootName?: string,
  partialRef?: PartialRef,
): ParseResult {
  const entry = pickEntry(stmtMap, rootName);
=======
  rootName: string | undefined,
  final: boolean,
): ParseResult {
  const entry = pickEntry(stmtMap, firstId, cat, rootName);
  const typedStmts = [...stmtMap.values()];
>>>>>>> Stashed changes

  const syms = new Map<string, ASTNode>();
  for (const [id, stmt] of stmtMap) {
    syms.set(id, stmt.kind === "state" ? stmt.init : stmt.expr);
  }
  const unres: string[] = [];
  const errors: ValidationError[] = [];
  // Track orphaned: start with value statement IDs, delete as they're reached.
  // Exclude root, state ($var), query, and mutation declarations — they're consumed separately.
  const unreached = new Set<string>();
  for (const [id, stmt] of stmtMap) {
    if (id === entry?.id) continue;
    if (stmt.kind === "state" || stmt.kind === "query" || stmt.kind === "mutation") continue;
    unreached.add(id);
  }
  const ctx: MaterializeCtx = {
    syms,
    cat,
    errors,
    unres,
    visited: new Set(),
    partial: wasIncomplete,
    currentStatementId: entry?.id,
    unreached,
  };

  let root: ElementNode | null = null;
  let rootExpression: ASTNode | undefined;
  if (entry) {
<<<<<<< Updated upstream
    const materialized = materializeValue(syms.get(entry.id)!, ctx);
=======
    // A reference back to the entry closes a cycle, so it is unresolved.
    ctx.visited.add(entry.id);
    const materialized = materializeValue(syms.get(entry.id)!, ctx);
    ctx.visited.delete(entry.id);
>>>>>>> Stashed changes
    if (isElementNode(materialized)) {
      root = materialized;
      root.statementId = entry.id;
    } else if (isASTNode(materialized) && containsComponent(materialized)) {
      rootExpression = materialized;
    }
  }

  const { stateDeclarations, queryStatements, mutationStatements } = extractStatements(
    typedStmts,
    ctx,
    partialRef,
  );

<<<<<<< Updated upstream
  // Streaming consumers drop parser errors until the stream ends, so this reads as a stream-end check.
  ctx.currentStatementId = entry?.id;
  const component = rootName ?? "";
  if (!entry) {
    pushValidationIssue(ctx, component, "", { code: "no-root", reason: "missing" });
  } else if (!root && !rootExpression && !resolvesToComponentCall(syms.get(entry.id), syms)) {
    pushValidationIssue(ctx, component, "", { code: "no-root", reason: "not-component" });
  } else if (entry.fallback) {
    pushValidationIssue(ctx, component, "", {
      code: "no-root",
      reason: root ? "fallback" : "missing",
    });
  }

  // With no entry nothing is reachable; `no-root` alone describes the problem.
  const orphaned = entry ? [...unreached] : [];
=======
  // `$x = Query(...)` runs, but `$x` in an expression reads the state store.
  for (const stmt of typedStmts) {
    if ((stmt.kind === "query" || stmt.kind === "mutation") && stmt.id.startsWith("$")) {
      ctx.currentStatementId = stmt.id;
      pushValidationIssue(ctx, stmt.call.callee, "", { code: "state-query" });
    }
  }

  // The entry is checked only once the stream has ended.
  if (final) {
    ctx.currentStatementId = entry?.id;
    const component = rootName ?? "";
    if (!entry) {
      pushValidationIssue(ctx, component, "", { code: "no-root", reason: "missing" });
    } else if (!root && !rootExpression && !isComponentCall(syms.get(entry.id), syms)) {
      pushValidationIssue(ctx, component, "", { code: "no-root", reason: "not-component" });
    } else if (entry.fallback) {
      pushValidationIssue(ctx, component, "", { code: "no-root", reason: "fallback" });
    }
  }

  const orphaned = [...unreached];
>>>>>>> Stashed changes

  return {
    root,
    ...(rootExpression ? { rootExpression } : {}),
    meta: {
      incomplete: wasIncomplete,
      unresolved: unres,
      orphaned,
      statementCount: stmtMap.size,
      errors: errors,
    },
    stateDeclarations,
    queryStatements,
    mutationStatements,
  };
}

/** Parse statement texts into `stmtMap` (last definition wins). Returns the first statement id. */
function addStatements(
  text: string,
  stmtMap: Map<string, Statement>,
  skip?: (id: string) => boolean,
): string {
  let firstId = "";
  for (const [start, end] of scanStatements(text).ranges) {
    const raw = splitStatementText(text.slice(start, end));
    if (!raw) continue;
    if (!firstId) firstId = raw.id;
    if (skip?.(raw.id)) continue;
    stmtMap.set(raw.id, classifyStatement(raw, parseExpression(raw.tokens)));
  }
  return firstId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

function skipString(input: string, start: number): number {
  if (input[start] !== '"') return start;
  let i = start + 1;
  while (i < input.length) {
    const c = input[i];
    if (c === "\\") {
      i += 2; // skip escape character and the escaped character
    } else if (c === '"') {
      return i + 1; // return index after the closing quote
    } else {
      i++;
    }
  }
  return i; // return length if string was unclosed
}

/** Index of the next ``` that starts a line, at or after `from`, or -1. */
function findFenceOpen(input: string, from: number): number {
  let i = input.indexOf("```", from);
  while (i > 0 && input[i - 1] !== "\n") i = input.indexOf("```", i + 1);
  return i;
}

/** Extract code from markdown fences, or return as-is if no fences found.
 *  A fence opens only with ``` at the start of a line; prose quotes shield
 *  nothing. Inside a fence, ``` inside double-quoted strings does not close it. */
export function stripFences(input: string): string {
  const blocks: string[] = [];
  let i = 0;

  while (i < input.length) {
    const fenceStart = findFenceOpen(input, i);
    if (fenceStart === -1) break;

    // Skip language tag until newline
    let j = fenceStart + 3;
    while (j < input.length && input[j] !== "\n") j++;
    if (j >= input.length) {
      // No newline after opening fence (streaming): the language tag is still arriving
      blocks.push("");
      break;
    }
    j++; // skip the newline

    // Scan for closing ``` while tracking string context
    let closePos = -1;
    let k = j;
    while (k < input.length) {
      const nextK = skipString(input, k);
      if (nextK > k) {
        k = nextK;
        continue;
      }
      if (input.startsWith("```", k)) {
        closePos = k;
        break;
      }
      k++;
    }

    if (closePos !== -1) {
      blocks.push(input.slice(j, closePos));
      i = closePos + 3;
    } else {
      // No closing fence found (streaming): take everything after opening fence
      blocks.push(input.slice(j));
      break;
    }
  }

  return blocks.length > 0 ? blocks.join("\n") : input;
}

/** Strip // and # line comments outside of strings (handles both " and ' delimiters). */
function stripComments(input: string): string {
  let inStr: false | '"' | "'" = false;
  return input
    .split("\n")
    .map((line) => {
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inStr) {
          if (c === "\\" && i + 1 < line.length) {
            i++; // skip escaped char
            continue;
          }
          if (c === inStr) inStr = false;
          continue;
        }
        if (c === '"' || c === "'") {
          inStr = c;
          continue;
        }
        // // style comments
        if (c === "/" && line[i + 1] === "/") {
          return line.substring(0, i).trimEnd();
        }
        // # style comments (Python/YAML style — LLMs sometimes use these)
        if (c === "#") {
          return line.substring(0, i).trimEnd();
        }
      }
      return line;
    })
    .join("\n");
}

/** Clean LLM response: strip fences, comments, whitespace. */
export function preprocess(input: string): string {
  return stripComments(stripFences(input.trim())).trim();
}

/**
 * Parse a complete openui-lang string in one pass.
 *
 * @param input  - Full openui-lang source text (may be partial/streaming)
 * @param cat    - Param map for positional-arg → named-prop mapping
 * @returns      ParseResult with root ElementNode (or null) and metadata
 */
export function parse(input: string, cat: ParamMap, rootName?: string): ParseResult {
  const trimmed = preprocess(input);
  if (!trimmed) return emptyResult();

  const { text, wasIncomplete } = autoClose(trimmed);
  const stmtMap = new Map<string, Statement>();
<<<<<<< Updated upstream
  for (const s of stmts) {
    const expr = parseExpression(s.tokens);
    const stmt = classifyStatement(s, expr);
    stmtMap.set(s.id, stmt);
  }
  // Derive from map to deduplicate — Map.set overwrites duplicates
  const typedStmts = [...stmtMap.values()];

  return buildResult(stmtMap, typedStmts, wasIncomplete, stmtMap.size, cat, rootName);
=======
  const firstId = addStatements(text, stmtMap);
  if (!stmtMap.size) return emptyResult(wasIncomplete);

  return buildResult(stmtMap, firstId, wasIncomplete, cat, rootName, true);
>>>>>>> Stashed changes
}

export interface StreamParser {
  /** Feed the next SSE/stream chunk and get the latest ParseResult.
   *  Pass `complete` once the stream has ended. */
  push(chunk: string, complete?: boolean): ParseResult;
  /** Set the full text — diffs against internal buffer, pushes only the delta.
   *  Resets automatically if the text was replaced (not appended).
   *  Pass `complete` once the stream has ended. */
  set(fullText: string, complete?: boolean): ParseResult;
  /** Get the latest ParseResult without consuming new data. */
<<<<<<< Updated upstream
  getResult(complete?: boolean): ParseResult;
=======
  getResult(): ParseResult;
  /**
   * Signal the end of the stream and get the final ParseResult. The pending
   * tail becomes completed (including a redefinition of an earlier name) and
   * end-of-stream checks such as `no-root` run, so the result equals `parse()`
   * of the full text. A later `push()` starts a new stream; a later `set()`
   * continues from the text it is given.
   */
  end(): ParseResult;
>>>>>>> Stashed changes
}

export function createStreamParser(cat: ParamMap, rootName?: string): StreamParser {
  let buf = ""; // raw accumulated input (kept for set() diffing)
  // Preprocessed view of `buf` (fences + comments stripped, same as parse()'s
  // preprocess). The completed-statement scan runs over THIS, never the raw
  // buffer — so leading markdown prose / ```fences``` (e.g. an apostrophe in
  // "You're …" before the program) can't corrupt statement-boundary detection.
  let cleaned = "";
  let completedEnd = 0; // watermark: how far into `cleaned` is already completed
  const completedStmtMap = new Map<string, Statement>();
<<<<<<< Updated upstream

  let completedCount = 0;

  function addStmt(text: string) {
    // `text` is sliced from `cleaned`, so it's already fence/comment-free.
    const t = text.trim();
    if (!t) return;
    for (const s of split(tokenize(t))) {
      const expr = parseExpression(s.tokens);
      const stmt = classifyStatement(s, expr);
      completedStmtMap.set(s.id, stmt);
      completedCount++;
    }
  }
=======
  let firstId = "";
  let ended = false;
>>>>>>> Stashed changes

  // Recompute `cleaned` from `buf`. If the already-completed prefix is no longer
  // a prefix of the new cleaned text (e.g. an opening ```fence``` just appeared
  // and shifted the stripped output), the watermark + cache are stale, so reset
  // and re-scan. When the prefix is stable (the common streaming case) the cache
  // is kept; pending text is overlaid on a copy when building the current result.
  function refreshCleaned() {
    const next = preprocess(buf);
    if (!next.startsWith(cleaned.slice(0, completedEnd))) {
      completedEnd = 0;
      completedStmtMap.clear();
<<<<<<< Updated upstream
      completedCount = 0;
=======
      firstId = "";
>>>>>>> Stashed changes
    }
    cleaned = next;
  }

  // Move statements whose boundary is decided into the completed cache.
  // Returns the start of the pending (not yet completed) text.
  function scanNewCompleted(): number {
    const { ranges, pendingStart } = scanStatements(cleaned, completedEnd, false);
    for (const [start, end] of ranges) {
      const raw = splitStatementText(cleaned.slice(start, end));
      if (raw) {
        completedStmtMap.set(raw.id, classifyStatement(raw, parseExpression(raw.tokens)));
        if (!firstId) firstId = raw.id;
      }
      completedEnd = end + 1;
    }
    return pendingStart;
  }

  function currentResult(complete = false): ParseResult {
    refreshCleaned();
<<<<<<< Updated upstream
    const pendingStart = scanNewCompleted();
    const pendingText = cleaned.slice(pendingStart).trim();

    // No pending text — all statements are complete
    if (!pendingText) {
      if (completedCount === 0) return emptyResult();
      return buildResult(
        completedStmtMap,
        [...completedStmtMap.values()],
        false,
        completedCount,
        cat,
        rootName,
      );
    }
=======
    const pendingText = cleaned.slice(scanNewCompleted()).trim();
>>>>>>> Stashed changes

    // `cleaned` is already preprocessed (fences + comments stripped); just
    // autoclose the incomplete trailing statement so it's syntactically valid.
    const { text: closed, wasIncomplete } = autoClose(pendingText);
<<<<<<< Updated upstream
    const stmts = split(tokenize(closed));

    if (!stmts.length) {
      if (completedCount === 0) return emptyResult(wasIncomplete);
      return buildResult(
        completedStmtMap,
        [...completedStmtMap.values()],
        wasIncomplete,
        completedCount,
        cat,
        rootName,
      );
    }

    // New IDs can render progressively; existing IDs are replaced only when
    // the pending expression no longer needs automatic closing.
    const allStmtMap = new Map(completedStmtMap);
    const pendingStmts = new Set<Statement>();
    for (const s of stmts) {
      if (completedStmtMap.has(s.id) && wasIncomplete) continue;
      const expr = parseExpression(s.tokens);
      const stmt = classifyStatement(s, expr);
      allStmtMap.set(s.id, stmt);
      pendingStmts.add(stmt);
    }
    // A `$name` ending the raw text may still be growing (`$d` of `$dishes`): skip it unless
    // the stream is complete or the same name already appears in full in the pending text.
    const tail = complete ? undefined : /\$\w+$/.exec(buf)?.[0];
    const tailName =
      tail &&
      pendingText.endsWith(tail) &&
      !new RegExp(`\\${tail}(?!\\w)`).test(pendingText.slice(0, -tail.length))
        ? tail
        : undefined;
    // Derive from map to deduplicate
    const allTypedStmts = [...allStmtMap.values()];

    return buildResult(
      allStmtMap,
      allTypedStmts,
      wasIncomplete,
      completedCount + stmts.length,
      cat,
      rootName,
      tailName ? { name: tailName, stmts: pendingStmts } : undefined,
=======
    const allStmtMap = new Map(completedStmtMap);
    // While streaming, a pending statement that needed implicit closing never
    // replaces a completed one. At stream end it does.
    const pendingFirstId = addStatements(
      closed,
      allStmtMap,
      (id) => !ended && wasIncomplete && completedStmtMap.has(id),
>>>>>>> Stashed changes
    );

    if (!allStmtMap.size) return emptyResult(cleaned ? wasIncomplete : true);
    return buildResult(allStmtMap, firstId || pendingFirstId, wasIncomplete, cat, rootName, ended);
  }

  function reset() {
    buf = "";
    cleaned = "";
    completedEnd = 0;
    completedStmtMap.clear();
<<<<<<< Updated upstream
    completedCount = 0;
  }

  return {
    push(chunk, complete) {
=======
    firstId = "";
    ended = false;
  }

  return {
    push(chunk) {
      // Chunks after the end signal are a new stream.
      if (ended) reset();
>>>>>>> Stashed changes
      buf += chunk;
      return currentResult(complete);
    },
<<<<<<< Updated upstream
    set(fullText, complete) {
=======
    set(fullText) {
      ended = false;
>>>>>>> Stashed changes
      if (fullText.length < buf.length || !fullText.startsWith(buf)) {
        reset();
      }
      const delta = fullText.slice(buf.length);
      if (delta) buf += delta;
      return currentResult(complete);
    },
    getResult: currentResult,
    end() {
      ended = true;
      return currentResult();
    },
  };
}

export interface Parser {
  parse(input: string): ParseResult;
}

type ActionDefs = Map<string, unknown>;

// {$ref: "#/$defs/ActionExpression"} -> its body, so action slots validate as inline unions
function inlineActionRefs(node: unknown, defs: ActionDefs): unknown {
  if (!node || typeof node !== "object") return node;
  const ref = (node as { $ref?: unknown }).$ref;
  if (typeof ref === "string") return defs.has(ref) ? inlineActionRefs(defs.get(ref), defs) : node;
  const copy = (Array.isArray(node) ? [...node] : { ...node }) as Record<string, unknown>;
  let changed = false;
  for (const [key, value] of Object.entries(copy)) {
    copy[key] = inlineActionRefs(value, defs);
    changed ||= copy[key] !== value;
  }
  return changed ? copy : node;
}

function compileParams(def: JSONSchemaDef, defs: ActionDefs): ParamDef[] {
  const properties = def.properties ?? {};
  const required = def.required ?? [];
  return Object.keys(properties).map((key) => ({
    name: key,
    required: required.includes(key),
    defaultValue: getSchemaDefaultValue(properties[key]),
    schema: defs.size ? inlineActionRefs(properties[key], defs) : properties[key],
  }));
}

export function compileSchema(schema: LibraryJSONSchema): ParamMap {
  const map: ParamMap = new Map();
<<<<<<< Updated upstream
  const components = schema.properties && new Set(Object.keys(schema.properties));
  // Action $defs (ActionExpression, OpenUrl, custom actions) are data shapes, never components
  const defs: ActionDefs = new Map();
  for (const name of [...Object.keys(ACTION_DEFS), ...Object.keys(schema.actions ?? {})]) {
    const body = schema.$defs?.[name];
    if (body && !components?.has(name)) defs.set(`#/$defs/${name}`, body);
  }
  for (const [name, def] of Object.entries(schema.$defs ?? {})) {
    // Skip non-component defs, e.g. zod's hoisted recursive schemas (__schema0).
    if (components ? !components.has(name) : defs.has(`#/$defs/${name}`)) continue;
    map.set(name, { params: compileParams(def, defs) });
  }
  // The call registry: the built-ins plus the library's functions and actions
  map.callDefs = new Map(BUILTIN_CALLS);
  for (const [name, fn] of Object.entries(schema.functions ?? {})) {
    map.callDefs.set(name, { kind: "function", params: compileParams(fn.params, defs) });
  }
  for (const [name, action] of Object.entries(schema.actions ?? {})) {
    map.callDefs.set(name, { kind: "action", params: compileParams(action.params, defs) });
=======
  const defs = schema.$defs ?? {};

  for (const [name, def] of Object.entries(defs)) {
    const properties = def.properties ?? {};
    const required = def.required ?? [];
    const params = Object.keys(properties).map((key) => ({
      name: key,
      required: required.includes(key),
      defaultValue: getSchemaDefaultValue(properties[key]),
      schema: properties[key],
    }));
    const aliases = Array.isArray(def.aliases)
      ? def.aliases.filter((alias): alias is string => typeof alias === "string")
      : [];
    map.set(name, aliases.length ? { params, aliases } : { params });
>>>>>>> Stashed changes
  }
  return map;
}

/**
 * Create a parser from a library JSON Schema document.
 * Pass `library.toJSONSchema()` to get the schema.
 *
 * @example
 * ```ts
 * const parser = createParser(library.toJSONSchema());
 * const result = parser.parse(openuiLangString);
 * ```
 */
export function createParser(schema: LibraryJSONSchema, rootName?: string): Parser {
  const paramMap = compileSchema(schema);
  return {
    parse(input: string): ParseResult {
      const telemetry = prepareParserParseTelemetry();
      try {
        const result = parse(input, paramMap, rootName);
        captureParserParseResult(telemetry, result);
        return result;
      } catch (error) {
        captureParserParseException(telemetry);
        throw error;
      }
    },
  };
}

/**
 * Create a streaming parser from a library JSON Schema document.
 * Pass `library.toJSONSchema()` to get the schema.
 */
export function createStreamingParser(schema: LibraryJSONSchema, rootName?: string): StreamParser {
  return createStreamParser(compileSchema(schema), rootName);
}
